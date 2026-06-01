-- ============================================================================
-- Cotizador PLUS — Despiece de tipos "caja" sin gaveta: BFD, W (superior), SVFD.
-- Fórmulas extraídas del Excel (madera). Roles: caja(Balance15)/refuerzo(Polar15)/
-- frente(Color18)/fondo. Canto estándar (19mm caja/refuerzo, 22mm frente).
-- ============================================================================

-- ---- BFD (Base Full Door): puertas + 1 entrepaño ----
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BFD';
  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base','caja','1','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_delantero','caja','1','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,40),
   (v,'entrepano','refuerzo','1','L-1.18','P-1.5','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,4,50),
   (v,'frente','frente','n_puertas','L/n_puertas','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,60),
   (v,'fondo','fondo','1','L-0.59','A','{}'::jsonb,0,0,70);
end $$;

-- ---- W (Wall / superior): base + tapa, n_entrepanos, puertas ----
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='W';
  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base_tapa','caja','2','L-1.18','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'entrepano','refuerzo','n_entrepanos','L-1.18','P-1.5','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,4,40),
   (v,'frente','frente','n_puertas','L/n_puertas','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,50),
   (v,'fondo','fondo','1','L-0.59','A-0.59','{}'::jsonb,0,0,60);
end $$;

-- ---- SVFD (Sink Vanity Full Door): como SBFD (refuerzo delantero ancho 5) ----
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='SVFD';
  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base','caja','1','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_delantero','caja','1','L-1.18','5','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,40),
   (v,'frente','frente','n_puertas','L/n_puertas','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,50),
   (v,'fondo','fondo','1','L-0.59','A','{}'::jsonb,0,0,60);
end $$;
