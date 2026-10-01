-- Hoja de ruta: UW1336 MBLE SUP COC 1 PUERTA 3 ENTREPAÑOS OPEN SHELF CARB2.
-- Referencia L=12in, A=36in, P=12in. UW conserva su estado inactivo actual.

-- BASE y TAPA son piezas separadas de 300.2 x 304.8mm.
update public.cot_piezas_plantilla p
set nombre = 'base',
    formula_cantidad = '1',
    formula_largo = 'L-0.181102',
    formula_ancho = 'P',
    tarugos = '8'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id and t.pref = 'UW' and p.nombre = 'base_tapa';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden)
select t.id,'tapa','caja','1','L-0.181102','P',
  '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,21
from public.cot_tipos_mueble t
where t.pref='UW' and not exists (
  select 1 from public.cot_piezas_plantilla p where p.tipo_mueble_id=t.id and p.nombre='tapa'
);

-- Rails posteriores y estante superior abierto.
update public.cot_piezas_plantilla p
set formula_largo = 'L-0.181102'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='UW' and p.nombre='refuerzo_trasero';

update public.cot_piezas_plantilla p
set formula_cantidad='n_entrepanos-1',
    formula_largo='L-0.220472',
    formula_ancho='P-1.5'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='UW' and p.nombre='entrepano';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden)
select t.id,'entrepano_superior','refuerzo','1','L-0.181102','P-0.905512',
  '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,0,4,41
from public.cot_tipos_mueble t
where t.pref='UW' and not exists (
  select 1 from public.cot_piezas_plantilla p where p.tipo_mueble_id=t.id and p.nombre='entrepano_superior'
);

-- Puerta de 715.22 x 327mm y BACKING de 898.4 x 314.2mm en UW1336.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden)
select t.id,'frente','frente','n_puertas','L+0.874016','A-7.841732',
  '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,80
from public.cot_tipos_mueble t
where t.pref='UW' and not exists (
  select 1 from public.cot_piezas_plantilla p where p.tipo_mueble_id=t.id and p.nombre='frente'
);

update public.cot_piezas_plantilla p
set formula_largo='L+0.370079', formula_ancho='A-0.62992'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='UW' and p.nombre='fondo';

-- La referencia trae tres entrepaños a 36in, no los dos de la regla global.
insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas)
select t.id,'n_entrepanos','true','3',10,'UW1336: tres entrepaños (uno superior abierto y dos interiores)'
from public.cot_tipos_mueble t
where t.pref='UW' and not exists (
  select 1 from public.cot_reglas_config r where r.tipo_mueble_id=t.id and r.variable='n_entrepanos'
);
