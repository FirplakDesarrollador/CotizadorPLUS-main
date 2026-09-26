-- ==========================================================================
-- Cotizador PLUS — tipologías derivadas de las hojas de ruta de producción
--
-- GENERADO por scripts/generar_tipologias.py a partir de "Hojas de ruta 2.xlsx".
-- No editar a mano: volver a generar. Ver WikiLLM/wiki/validacion_hojas_de_ruta.md.
--
-- Cada bloque indica qué porcentaje del despiece real reproduce la plantilla
-- dentro de 1 mm. Las plantillas NO traen herrajes, tarugos ni soportes: eso
-- se completa a mano por familia (las hojas de ruta no los modelan como pieza).
--
-- Requiere 0028_geometria_espesor_reveal.sql (variables RV/TC/TB en el motor).
-- ==========================================================================
-- --------------------------------------------------------------------------
-- Alias métricos: `I…` es la nomenclatura métrica de un tipo ya existente,
-- no una tipología nueva. Se registra como pref_metrico.
-- --------------------------------------------------------------------------
update public.cot_tipos_mueble set pref_metrico = 'IC' where pref = 'DB';
update public.cot_tipos_mueble set pref_metrico = 'ILVP' where pref = 'SBFD';
update public.cot_tipos_mueble set pref_metrico = 'IP' where pref = 'BFD';

-- --------------------------------------------------------------------------
-- AL — Alacena de cocina
-- Derivado de 6 hojas de ruta. La plantilla reproduce 47/48 piezas (98%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('AL', 'Alacena de cocina', 'Alacena de cocina', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'AL');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('entrepano','refuerzo','4','L-1.22047','P-1.53937','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','3','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('lateral','caja','2','A-3.93701','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('entrepano','refuerzo','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,60),
    ('fondo','fondo','1','A-4.01575','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,70),
    ('gola_perfil','caja','gola*1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,80)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'AL';

-- --------------------------------------------------------------------------
-- BLS — Mueble inferior esquinero giratorio (Lazy Susan)
-- Derivado de 2 hojas de ruta. La plantilla reproduce 17/24 piezas (71%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('BLS', 'Mueble inferior esquinero giratorio (Lazy Susan)', 'Mueble inferior esquinero giratorio (Lazy Susan)', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'BLS');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A-TC','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('fondo','fondo','2','L-4.94882','A-TC','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L','L','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','7.87402','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('frente','frente','2','A-RV','L*0.30556','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,50),
    ('refuerzo_trasero','refuerzo','1','A-TC','7.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('refuerzo_delantero','refuerzo','1','L-24.59055','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,70),
    ('entrepano','refuerzo','1','29.82677','29.82677','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,80),
    ('refuerzo_delantero','refuerzo','1','L-23.52756','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,90),
    ('entrepano','refuerzo','1','34.77953','34.77953','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,100),
    ('frente','frente','1','A-2*TC','11.00000','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,110),
    ('frente','frente','1','A-2*TC','11.74803','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,120)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'BLS';

-- --------------------------------------------------------------------------
-- BMW — Mueble inferior para microondas
-- Derivado de 2 hojas de ruta. La plantilla reproduce 19/20 piezas (95%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('BMW', 'Mueble inferior para microondas', 'Mueble inferior para microondas', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'BMW');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P-1.06299','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('base_gaveta','refuerzo','1','L-4.37008','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('trasero_gaveta','refuerzo','1','L-4.84252','2.67717','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('frente_gaveta','frente','1','7.61102','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,70),
    ('fondo','fondo','1','9.50079','L-0.86614','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,80),
    ('entrepano','refuerzo','1','L-2*TC','P-1.06299','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,90),
    ('frente','frente','1','18.33386','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,100)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'BMW';

-- --------------------------------------------------------------------------
-- BOV — Mueble inferior para horno
-- Derivado de 10 hojas de ruta. La plantilla reproduce 32/40 piezas (80%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('BOV', 'Mueble inferior para horno', 'Mueble inferior para horno', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'BOV');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P-0.70866','{"calibre":"19x0,45","largos":0,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P-TC','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'BOV';

-- --------------------------------------------------------------------------
-- BT — Base y tapa sueltas
-- Derivado de 3 hojas de ruta. La plantilla reproduce 6/6 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('BT', 'Base y tapa sueltas', 'Base y tapa sueltas', 'pieza', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'BT');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,10),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'BT';

-- --------------------------------------------------------------------------
-- CC — Módulo de clóset
-- Derivado de 23 hojas de ruta. La plantilla reproduce 141/161 piezas (88%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('CC', 'Módulo de clóset', 'Módulo de clóset', 'closet', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'CC');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('refuerzo_trasero','refuerzo','3','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10),
    ('entrepano','refuerzo','2','L-1.45669','P','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('lateral','caja','2','A-4.50000','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('frente','frente','1','A-4.62598','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,60),
    ('entrepano','refuerzo','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,70)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'CC';

-- --------------------------------------------------------------------------
-- CLV — Clóset vertical
-- Derivado de 8 hojas de ruta. La plantilla reproduce 55/64 piezas (86%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('CLV', 'Clóset vertical', 'Clóset vertical', 'closet', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'CLV');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('zocalo','caja','2','L-2*TC','2.75591','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('lateral_gaveta','refuerzo','4','17.71654','6.00000','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('entrepano','refuerzo','2','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,40),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,60),
    ('ref_sup','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,70),
    ('ref_inf','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,80)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'CLV';

-- --------------------------------------------------------------------------
-- DD — Cajón adicional
-- Derivado de 2 hojas de ruta. La plantilla reproduce 20/20 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('DD', 'Cajón adicional', 'Cajón adicional', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('lateral','caja','2','4.72441','P-3.28346','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,20),
    ('ref_inf_tra','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('trasero_gav','caja','1','3.93701','L-3.36220','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('contraparche_gav_r13l','caja','1','4.72441','L-3.36220','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('base_gaveta','fondo','1','P-3.55906','L-2.81102','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('parche_gaveta','caja','1','A-RV','L-RV','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,70),
    ('ref_tra','caja','1','L-2*TC','A','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,80),
    ('ref_inf_del','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,90),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,100)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'DD';

-- --------------------------------------------------------------------------
-- DF — Frente de gaveta suelto
-- Derivado de 6 hojas de ruta. La plantilla reproduce 6/6 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('DF', 'Frente de gaveta suelto', 'Frente de gaveta suelto', 'pieza', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DF');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('frente','frente','1','L','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,10)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'DF';

-- --------------------------------------------------------------------------
-- DFE — Gavetero de clóset
-- Derivado de 6 hojas de ruta. La plantilla reproduce 33/36 piezas (92%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('DFE', 'Gavetero de clóset', 'Gavetero de clóset', 'closet', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DFE');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','4.00000','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('filler_der','caja','1','A','P--4.50000','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,20),
    ('base_gaveta','fondo','1','17.72441','19.15354','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,30),
    ('trasero_gav','caja','1','A-2.78740','L-3.89764','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('contraparche_gav_r13a','caja','1','4.00000','L-3.89764','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('parche_gaveta','caja','1','A','L-0.82677','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'DFE';

-- --------------------------------------------------------------------------
-- E — Entrepaño suelto
-- Derivado de 2 hojas de ruta. La plantilla reproduce 2/2 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('E', 'Entrepaño suelto', 'Entrepaño suelto', 'pieza', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'E');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('entrepano','refuerzo','1','L-1.22047','22.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'E';

-- --------------------------------------------------------------------------
-- FL — Relleno (filler) suelto
-- Derivado de 11 hojas de ruta. La plantilla reproduce 11/11 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('FL', 'Relleno (filler) suelto', 'Relleno (filler) suelto', 'filler', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'FL');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('filler','caja','1','A','L','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'FL';

-- --------------------------------------------------------------------------
-- KD — Kit de cajones
-- Derivado de 2 hojas de ruta. La plantilla reproduce 4/4 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('KD', 'Kit de cajones', 'Kit de cajones', 'kit', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'KD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('base_gaveta','refuerzo','1','L-2.43110','19.62520','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10),
    ('trasero_gaveta','refuerzo','1','L-2.43110','2.75000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'KD';

-- --------------------------------------------------------------------------
-- KF — Kit de frentes
-- Derivado de 11 hojas de ruta. La plantilla reproduce 9/11 piezas (82%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('KF', 'Kit de frentes', 'Kit de frentes', 'kit', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'KF');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('frente','frente','2','A-RV','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,10)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'KF';

-- --------------------------------------------------------------------------
-- POD — Módulo de cajón
-- Derivado de 8 hojas de ruta. La plantilla reproduce 35/48 piezas (73%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('POD', 'Módulo de cajón', 'Módulo de cajón', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'POD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('frente_gaveta','frente','1','A-RV','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,30),
    ('refuerzo_trasero','refuerzo','1','L-2*TC','A','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('trasero_gaveta','refuerzo','1','L-4.60630','2.67717','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('base_gaveta','refuerzo','1','L-4.13386','P-4.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'POD';

-- --------------------------------------------------------------------------
-- S — Mueble superior de cocina
-- Derivado de 32 hojas de ruta. La plantilla reproduce 171/192 piezas (89%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('S', 'Mueble superior de cocina', 'Mueble superior de cocina', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'S');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('entrepano','refuerzo','2','L-1.22047','P-1.50000','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('fondo','fondo','1','A-0.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'S';

-- --------------------------------------------------------------------------
-- SA — Mueble superior alto de cocina
-- Derivado de 5 hojas de ruta. La plantilla reproduce 25/30 piezas (83%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('SA', 'Mueble superior alto de cocina', 'Mueble superior alto de cocina', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SA');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('entrepano','refuerzo','2','L-1.22047','P-1.50000','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,50),
    ('fondo','fondo','1','A-0.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'SA';

-- --------------------------------------------------------------------------
-- SBAS — Mueble superior de puerta basculante
-- Derivado de 2 hojas de ruta. La plantilla reproduce 16/20 piezas (80%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('SBAS', 'Mueble superior de puerta basculante', 'Mueble superior de puerta basculante', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBAS');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('fondo','fondo','1','A-0.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('gola_perfil','caja','gola*1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('frente','frente','1','14.60039','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,70),
    ('frente','frente','1','11.84843','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,80),
    ('entrepano','refuerzo','1','L-2*TC','P-0.90551','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,90),
    ('frente','frente','1','A--1.60827','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,100)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'SBAS';

-- --------------------------------------------------------------------------
-- SDB — Cajonera con panel removible
-- Derivado de 2 hojas de ruta. La plantilla reproduce 31/44 piezas (70%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('SDB', 'Cajonera con panel removible', 'Cajonera con panel removible', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SDB');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P-1.06299','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('base_gaveta','refuerzo','2','17.62992','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('frente_gaveta','frente','2','13.81890','21.87402','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,60),
    ('fondo','fondo','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,70),
    ('base_gaveta','refuerzo','1','19.62992','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,80),
    ('frente_gaveta','frente','1','13.81890','23.87402','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,90),
    ('panel','frente','1','13.81890','23.87402','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,100),
    ('division','caja','1','A-2*TC','P-1.06299','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,110),
    ('base_gaveta','refuerzo','2','16.62992','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,120),
    ('frente_gaveta','frente','2','13.81890','20.87402','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,130),
    ('tras_gav_sup_l_a','caja','1','17.15748','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,140),
    ('tras_gav_inf_l_a','caja','1','17.15748','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,150),
    ('tras_gav_inf_l_b','caja','1','19.15748','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,160),
    ('tras_gav_sup_l_a','caja','1','16.15748','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,170),
    ('tras_gav_inf_l_a','caja','1','16.15748','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,180),
    ('tras_gav_inf_l_b','caja','1','19.15748','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,190),
    ('frente','frente','1','19.33071','4.00000','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,200),
    ('fondo','fondo','1','16.62992','17.36220','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,210),
    ('trasero_pod21','caja','1','16.15748','2.67717','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,220)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'SDB';

-- --------------------------------------------------------------------------
-- SLOC — Mueble superior locero
-- Derivado de 2 hojas de ruta. La plantilla reproduce 12/12 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('SLOC', 'Mueble superior locero', 'Mueble superior locero', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SLOC');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('frente','frente','2','A--0.62402','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('fondo','fondo','1','A-0.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'SLOC';

-- --------------------------------------------------------------------------
-- SMO — Mueble superior abierto para microondas
-- Derivado de 2 hojas de ruta. La plantilla reproduce 12/12 piezas (100%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('SMO', 'Mueble superior abierto para microondas', 'Mueble superior abierto para microondas', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SMO');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('base','caja','1','L-2*TC','P--4.72441','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('fondo','fondo','1','A-0.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('entrepano','refuerzo','1','L-1.22047','11.49213','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'SMO';

-- --------------------------------------------------------------------------
-- UDB — Mueble inferior cajonera (línea U)
-- Derivado de 5 hojas de ruta. La plantilla reproduce 49/50 piezas (98%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('UDB', 'Mueble inferior cajonera (línea U)', 'Mueble inferior cajonera (línea U)', 'inferior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'UDB');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('refuerzo_delantero','refuerzo','3','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,10),
    ('base_gaveta','refuerzo','3','L-4.13386','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,40),
    ('trasero_gaveta','refuerzo','2','L-4.60630','7.20472','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('frente_gaveta','frente','2','A*0.39781','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,60),
    ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,70),
    ('trasero_gaveta','refuerzo','1','L-4.60630','2.67717','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,80),
    ('frente_gaveta','frente','1','5.50000','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,90),
    ('fondo','fondo','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,100)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'UDB';

-- --------------------------------------------------------------------------
-- USVFD — Mueble inferior lavamanos puertas (línea U)
-- Derivado de 36 hojas de ruta. La plantilla reproduce 208/216 piezas (96%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('USVFD', 'Mueble inferior lavamanos puertas (línea U)', 'Mueble inferior lavamanos puertas (línea U)', 'vanity', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'USVFD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('frente','frente','2','A-RV','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,10),
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,20),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,30),
    ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','3.77953','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('fondo','fondo','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'USVFD';

-- --------------------------------------------------------------------------
-- UV — Mueble inferior baño 1 cajón 1 puerta (línea U)
-- Derivado de 11 hojas de ruta. La plantilla reproduce 97/110 piezas (88%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('UV', 'Mueble inferior baño 1 cajón 1 puerta (línea U)', 'Mueble inferior baño 1 cajón 1 puerta (línea U)', 'vanity', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'UV');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_delantero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,30),
    ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('trasero_gaveta','refuerzo','1','L-4.60630','2.67717','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,50),
    ('entrepano','refuerzo','1','L-1.22047','11.81102','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('frente','frente','1','A-5.75197','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,70),
    ('frente_gaveta','frente','1','5.50000','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,80),
    ('pieza_cajon','caja','1','L-4.13386','19.37008','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,90),
    ('fondo','fondo','1','A-0.07874','L-0.70866','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,100)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'UV';

-- --------------------------------------------------------------------------
-- UVFD — Mueble inferior baño puertas (línea U)
-- Derivado de 3 hojas de ruta. La plantilla reproduce 20/21 piezas (95%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('UVFD', 'Mueble inferior baño puertas (línea U)', 'Mueble inferior baño puertas (línea U)', 'vanity', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'UVFD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('frente','frente','2','A-RV','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('refuerzo_delantero','refuerzo','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('fondo','fondo','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('shlef','caja','1','L-1.22047','P-2.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,70)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'UVFD';

-- --------------------------------------------------------------------------
-- WCC — Módulo de clóset con división
-- Derivado de 11 hojas de ruta. La plantilla reproduce 71/77 piezas (92%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('WCC', 'Módulo de clóset con división', 'Módulo de clóset con división', 'closet', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WCC');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A-0.01181','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('zocalo','caja','2','L-2*TC','2.75591','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,20),
    ('entrepano','refuerzo','2','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('ref_sup','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,60),
    ('ref_inf','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,70)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'WCC';

-- --------------------------------------------------------------------------
-- WER — Mueble superior esquinero
-- Derivado de 3 hojas de ruta. La plantilla reproduce 19/24 piezas (79%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('WER', 'Mueble superior esquinero', 'Mueble superior esquinero', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WER');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('entrepano','refuerzo','2','22.00000','22.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10),
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,20),
    ('fondo','fondo','2','A-2*TC','L-2.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,30),
    ('refuerzo_trasero','refuerzo','1','A-2*TC','6.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,40),
    ('base','caja','1','L-TC','L-TC','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('tapa','caja','1','L-TC','L-TC','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,60),
    ('frente','frente','1','A--0.62402','11.00000','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,70),
    ('frente','frente','1','A--0.62402','11.75000','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,80)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'WER';

-- --------------------------------------------------------------------------
-- WLD — Mueble superior con luz
-- Derivado de 6 hojas de ruta. La plantilla reproduce 40/42 piezas (95%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('WLD', 'Mueble superior con luz', 'Mueble superior con luz', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WLD');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('lateral','caja','2','A-1.00000','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,10),
    ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,20),
    ('frente','frente','2','A-RV','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('fondo','fondo','1','A-1.62992','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,60),
    ('entrepano','refuerzo','2','L-1.22047','10.50000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,70)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'WLD';

-- --------------------------------------------------------------------------
-- WPC — Alacena superior de cocina
-- Derivado de 2 hojas de ruta. La plantilla reproduce 16/24 piezas (67%) dentro de 1mm.
-- --------------------------------------------------------------------------
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)
values ('WPC', 'Alacena superior de cocina', 'Alacena superior de cocina', 'superior', 'muebles', null)
on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();

delete from public.cot_piezas_plantilla
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WPC');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
select id, v.* from public.cot_tipos_mueble,
  (values
    ('refuerzo_trasero','refuerzo','3','L-2*TC','3.14961','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,10),
    ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,20),
    ('entrepano','refuerzo','3','L-1.45669','P-1.53937','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,30),
    ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,40),
    ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,50),
    ('frente','frente','2','36.62402','L*0.49475','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,60),
    ('frente','frente','2','A-36.87598','L*0.49475','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,70),
    ('entrepano','refuerzo','2','L-1.45669','22.00000','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,80),
    ('entrepano','refuerzo','1','L-2*TC','P-1.02362','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,90),
    ('fondo','fondo','1','A-0.07874','L-0.86614','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,100),
    ('fondo','fondo','1','A-0.86614','L-0.86614','{"calibre":"19x0,45","largos":0,"anchos":0}'::jsonb,110),
    ('frente','frente','1','A-RV','L-RV','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,120)
  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
where pref = 'WPC';
