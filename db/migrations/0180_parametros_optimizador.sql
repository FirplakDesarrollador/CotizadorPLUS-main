-- 0180 — Parámetros de planta del optimizador de corte
--
-- Crea la llave `optimizador` en cot_parametros con las condiciones confirmadas por
-- producción el 2026-10-07 (seccionadora Holz-Her, disco 4,4 mm, pila 4 en 15 mm y
-- 3 en 18 mm, refilado 5 mm, sobrante útil 1000 × 500 mm, formatos 2440 × 1830 y
-- 2460 × 1240, desperdicio máximo 15 %). Los niveles de corte (3) son provisionales.
-- Se editan desde la pestaña Optimizador; el código normaliza el JSON al leerlo
-- (src/lib/corte/config.ts), así que llaves faltantes toman el valor por defecto.
--
-- Idempotente: no pisa el valor si la llave ya existe (on conflict do nothing).
-- Ver docs/plan_optimizador_corte.md y WikiLLM/wiki/optimizador_corte.md.

insert into public.cot_parametros (key, value, descripcion) values (
  'optimizador',
  '{
    "maquina": "Seccionadora Holz-Her",
    "discoMm": 4.4,
    "nivelesCorte": 3,
    "giraLamina": true,
    "refiladoMm": 5,
    "refiladoMaxMm": 9,
    "refilarSoloZonaUsada": true,
    "sobranteMinLargoMm": 1000,
    "sobranteMinAnchoMm": 500,
    "sobranteEnUltimaLamina": true,
    "desperdicioMaxPct": 15,
    "piezasPorDia": 0,
    "pilas": [{"espesorMm": 15, "laminas": 4}, {"espesorMm": 18, "laminas": 3}],
    "formatos": [
      {"codigo": "183X244", "largoMm": 2440, "anchoMm": 1830, "activo": true},
      {"codigo": "124X246", "largoMm": 2460, "anchoMm": 1240, "activo": true},
      {"codigo": "122X244", "largoMm": 2440, "anchoMm": 1220, "activo": false},
      {"codigo": "280X207", "largoMm": 2800, "anchoMm": 2070, "activo": false}
    ],
    "texturas": [
      {"nombre": "Soft", "rotaVeta": true},
      {"nombre": "Rustick", "rotaVeta": false},
      {"nombre": "Amazonas", "rotaVeta": false}
    ],
    "criterio": ["desperdicio", "laminas", "sobrante_ultima", "cortes"]
  }'::jsonb,
  'Parámetros de planta del optimizador de corte (sierra, refilado, pila, sobrantes, formatos, veta, criterio y piezas por día).'
)
on conflict (key) do nothing;
