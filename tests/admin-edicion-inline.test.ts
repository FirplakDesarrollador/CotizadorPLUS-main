import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('la edicion de catalogos se muestra debajo de la fila seleccionada', () => {
  const source = readFileSync('src/app/admin/AdminCatalogos.tsx', 'utf8');
  assert.match(source, /editing && !editing\.id[\s\S]*title="Nuevo registro"/);
  assert.match(source, /editing\?\.id === r\.id[\s\S]*<tr className="border-b border-slate-200">/);
  assert.match(source, /<CatalogEditForm title="Editar registro"/);
  assert.match(source, /colSpan=\{fields\.length\}/);
});
