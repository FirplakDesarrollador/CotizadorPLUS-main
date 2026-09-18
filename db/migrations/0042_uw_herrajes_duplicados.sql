-- UW cobraba bisagras y manijas por duplicado.
--
-- `engine.ts` recorre TODAS las filas de cot_herrajes_plantilla del tipo y suma cada
-- una (no deduplica por rol):
--     for (const hp of (inp.herrajesPlantilla || [])) { ... costoHerrajes += costo; }
-- UW tenía dos filas `bisagra` idénticas (BISAGRAPAR:n_puertas) y dos filas `manija`
-- (MANIJA415 con 'n_puertas + n_cajones' y con 'n_puertas'), así que un UW de 2 puertas
-- cotizaba 4 pares de bisagra y 4 manijas en vez de 2 y 2.
--
-- UW está hoy `activo = false`, así que no hay cotizaciones afectadas; se corrige para
-- que no quede armado el día que se reactive. Es el unico tipo del catalogo con filas
-- duplicadas por rol (verificado con un group by ... having count(*) > 1).
--
-- Se conserva `n_puertas + n_cajones` en la manija, que es la fórmula que usan los demás
-- superiores del catálogo (W y WBL), y una sola de las dos bisagras idénticas.

-- Deja una sola fila por (tipo, rol), quedándose con la de menor `orden` y, a igualdad,
-- con la fórmula más larga -- que es justamente 'n_puertas + n_cajones' en la manija.
delete from cot_herrajes_plantilla h
using cot_tipos_mueble t
where h.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and h.id not in (
    select distinct on (x.rol) x.id
    from cot_herrajes_plantilla x
    where x.tipo_mueble_id = h.tipo_mueble_id
    order by x.rol, length(x.formula_cantidad) desc, x.orden
  );
