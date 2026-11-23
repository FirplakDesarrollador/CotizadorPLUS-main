import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../db/migrations/0184_tipologias_abiertas_bfd_sbfd.sql', import.meta.url), 'utf8');
const expected = [['BFD','OBFD'],['BFD-SM','OBFD-SM'],['SBFD','OSBFD'],['SBFD-SM','OSBFD-SM']] as const;

test('crea una tipologia abierta por cada variante BFD y SBFD', () => {
  for (const [source,target] of expected) assert.match(migration,new RegExp(`\\('${source}',\\s*'${target}'`));
  assert.match(migration,/OBFD'[\s\S]*Mueble inferior \(sin puertas\)/);
  assert.match(migration,/OSBFD'[\s\S]*Mueble inferior lavaplatos \(sin puertas\)/);
});

test('el clon excluye solo piezas con rol frente', () => {
  assert.match(migration,/where p\.rol_tablero is distinct from 'frente'/);
  assert.doesNotMatch(migration,/where p\.nombre (?:<>|!=)/);
});

test('conserva reglas, herrajes y metadatos funcionales', () => {
  assert.match(migration,/s\.etiquetas_und, s\.usa_carton/);
  assert.match(migration,/s\.permite_agrupacion/);
  assert.match(migration,/insert into public\.cot_reglas_config/);
  assert.match(migration,/insert into public\.cot_herrajes_plantilla/);
  assert.match(migration,/p\.modo_agrupacion,p\.clave_fusion/);
});
