"""Extrae paneles y tarugos posicionados del STEP BOV-SMG (AP214, mm).
No es un lector CAD general: requiere caras de panel con vertices extremos y
transformaciones ortogonales. Conserva la fuente intacta y emite JSON para QA.
Uso: python scripts/extraer-bov-step.py archivo.step salida.json
"""
import hashlib
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1])
raw = source.read_bytes()
entities = {int(n): value for n, value in re.findall(r'#(\d+)\s*=\s*(.*?);', raw.decode(), re.S)}
def refs(value):
    return [int(n) for n in re.findall(r'#(\d+)', value)]
def vector(entity):
    return [float(v) for v in re.search(r'\(([-\d.E+, ]+)\)\s*\)', entities[entity])[1].split(',')]
def axis(entity):
    origin, z, x = [vector(n) for n in refs(entities[entity])]
    y = [z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]]
    for v in [x, y, z]:
        if sum(abs(abs(c)-1)<1e-7 for c in v)!=1 or sum(abs(c)>1e-7 for c in v)!=1:
            raise ValueError('Transformacion no ortogonal: requiere lector CAD completo')
    return origin, [x, y, z]
def transform(point, start, end):
    a, basis_a = axis(start)
    b, basis_b = axis(end)
    local = [sum((point[i]-a[i])*v[i] for i in range(3)) for v in basis_a]
    return [b[i]+sum(local[j]*basis_b[j][i] for j in range(3)) for i in range(3)]
def descendants(entity):
    seen, stack = set(), [entity]
    while stack:
        n = stack.pop()
        if n in seen:
            continue
        seen.add(n)
        stack.extend(refs(entities[n]))
    return seen

root = next(n for n,v in entities.items() if v.startswith('PRODUCT_DEFINITION(') and 'HRJ BOV8078.561-SMG' in v)
expected = {'Base','LatDer','LatIzq (1)','RefTraInf','RefTraSup','Frente'}
def shape_for_product(product):
    shape = next(n for n,v in entities.items() if v.startswith('PRODUCT_DEFINITION_SHAPE(') and refs(v)==[product])
    representation = next(refs(v)[1] for v in entities.values() if v.startswith('SHAPE_DEFINITION_REPRESENTATION(') and refs(v)[0]==shape)
    brep_rep = next(refs(v)[1] for v in entities.values() if v.startswith('SHAPE_REPRESENTATION_RELATIONSHIP(') and refs(v)[0]==representation)
    return refs(entities[brep_rep])[0]
def placement_for_occurrence(occurrence):
    occurrence_shape = next(n for n,v in entities.items() if v.startswith('PRODUCT_DEFINITION_SHAPE(') and refs(v)==[occurrence])
    relationship = next(refs(v)[0] for v in entities.values() if v.startswith('CONTEXT_DEPENDENT_SHAPE_REPRESENTATION(') and refs(v)[1]==occurrence_shape)
    trans = int(re.search(r'REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION\(#(\d+)\)',entities[relationship])[1])
    return refs(entities[trans])
def world_bounds(solid, placement):
    points=[vector(refs(entities[n])[0]) for n in descendants(solid) if entities[n].startswith('VERTEX_POINT(')]
    points=[transform(p,*placement) for p in points]
    return ([min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)])
panels = []
for occurrence, value in entities.items():
    if not value.startswith('NEXT_ASSEMBLY_USAGE_OCCURRENCE('):
        continue
    parent, child = refs(value)
    if parent != root:
        continue
    name = re.match(r"PRODUCT_DEFINITION\('([^']*)'", entities[child])[1]
    if name not in expected:
        raise ValueError('Panel inesperado: '+name)
    solid=shape_for_product(child)
    low,high=world_bounds(solid,placement_for_occurrence(occurrence))
    panels.append({'name':name,'solid':solid,'min':low,'max':high})
if {p['name'] for p in panels} != expected or len(panels)!=6:
    raise ValueError('El conjunto no tiene los seis paneles esperados')
low = [min(p['min'][i] for p in panels) for i in range(3)]
for p in panels:
    p['position']=[round(p['min'][i]-low[i],6) for i in range(3)]
    p['size']=[round(p['max'][i]-p['min'][i],6) for i in range(3)]
    del p['min'],p['max']
tarugo_product=next(n for n,v in entities.items() if v.startswith('PRODUCT_DEFINITION(') and "'Tarugo 8x30mm'" in v)
tarugo_solido=shape_for_product(tarugo_product)
tarugos=[]
for occurrence,value in entities.items():
    if not value.startswith('NEXT_ASSEMBLY_USAGE_OCCURRENCE(') or 'Tarugo 8x30mm:' not in value:
        continue
    parent,child=refs(value)
    if child!=tarugo_product:
        raise ValueError('El STEP contiene otro producto bajo el nombre Tarugo 8x30mm')
    minimum,maximum=world_bounds(tarugo_solido,placement_for_occurrence(occurrence))
    tarugos.append({'position':[round(minimum[i]-low[i],6) for i in range(3)],'size':[round(maximum[i]-minimum[i],6) for i in range(3)]})
if len(tarugos)!=24 or any(max(abs(v-round(v)) for v in t['size'])>.01 for t in tarugos):
    raise ValueError('El STEP no contiene los 24 tarugos con coordenadas ortogonales esperados')
result={'source':source.name,'sha256':hashlib.sha256(raw).hexdigest(),'units':'mm','tarugos':tarugos,'panels':panels}
destination=Path(sys.argv[2])
destination.parent.mkdir(parents=True,exist_ok=True)
destination.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
