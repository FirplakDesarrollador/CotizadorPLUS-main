# Clientes de Supabase y la frontera de RLS

## Los dos clientes de `src/lib/supabase/server.ts`

`createClient()` es el único punto de entrada al servidor, y lo usan 17 módulos
entre `src/app` y `src/lib`. Devuelve **uno de dos clientes distintos** según el
contexto, y la diferencia importa:

| Contexto | Clave | RLS |
| --- | --- | --- |
| Dentro de un request de Next (Server Component, Server Action, route handler) | anónima + cookies de sesión | **la aplica** |
| Fuera de un request (scripts, CLI, workers) | `SUPABASE_SERVICE_ROLE_KEY` | **la ignora** |

La discriminación es `cookies()`: dentro de un request devuelve el almacén de
cookies; fuera, lanza. Ese lanzamiento es la señal de que no hay sesión que
respetar.

## El defecto: un `catch` demasiado ancho

El release `v1.0.3` (`b8cb75c`) introdujo la rama elevada envolviendo **todo** el
cuerpo de la función:

```ts
export async function createClient() {
  try {
    const cookieStore = await cookies();
    return createServerClient(URL, KEY, { ... });   // <- también dentro del try
  } catch {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || KEY;
    return createSupabaseClient(URL, serviceKey);
  }
}
```

Dos problemas, y el primero es el grave:

1. **Cualquier error produce un cliente sin RLS.** El `try` cubría también
   `createServerClient()`. Si eso fallaba por cualquier motivo ajeno al request
   scope —una variable de entorno mal formada, un cambio de la librería—, la
   función devolvía en silencio un cliente con la clave de servicio. Una función
   cuyo propio comentario dice "respeta RLS" podía devolver una que no, y no de
   forma teórica: `SUPABASE_SERVICE_ROLE_KEY` está configurada, así que el
   fallback resolvía a una clave real, en los 17 módulos que la llaman.

2. **Faltar la clave degradaba a la anónima en silencio.** El `|| KEY` convertía
   un problema de configuración en fallos de RLS difusos, mucho más adelante y
   lejos de la causa.

## El arreglo

El `try` envuelve **solo la lectura de cookies**, que es exactamente la condición
que se quiere detectar. Todo lo demás se propaga:

```ts
let cookieStore: Awaited<ReturnType<typeof cookies>>;
try {
  cookieStore = await cookies();
} catch {
  return createElevatedClient();   // la unica via a la rama elevada
}
return createServerClient(URL, KEY, { ... });
```

Y `createElevatedClient()` **lanza** si falta `SUPABASE_SERVICE_ROLE_KEY`, en vez
de caer a la anónima: un cliente anónimo silencioso solo retrasa el diagnóstico.

No se cambió nada del camino normal: dentro de un request sigue siendo el mismo
cliente con cookies y la misma clave anónima.

## Deuda conocida

**El privilegio no se ve en el sitio de llamada.** `createClient()` puede devolver
un cliente elevado y quien la invoca no lo distingue. Lo limpio sería exportar dos
funciones y que cada llamador declare lo que necesita, pero eso obliga a revisar
los 17 consumidores y decidir uno por uno. Queda pendiente; el arreglo de aquí
cierra la vía accidental, no rediseña la API.

El módulo lee el entorno **al cargarse** (`const URL = process.env...`), de modo
que cambiar una variable despues del import no tiene efecto. No se modificó, pero
conviene saberlo: es lo que obliga a los tests a preparar el entorno antes de
importar.

## Cobertura

`tests/supabase-server-client.test.ts` corre fuera de Next, donde `cookies()`
lanza, así que ejerce la rama elevada: comprueba que sin clave de servicio
**lanza nombrando la variable** (antes devolvía un cliente anónimo) y que con
clave construye un cliente de Supabase real. Verificado que el primer caso falla
con el código del release y pasa con el arreglo.

Lo que esa vía **no** puede cubrir es el otro lado: que un fallo de
`createServerClient` se propague en lugar de caer a la rama elevada, porque
exigiría un request de Next real. Ahí la garantía es estructural — el `try`
envuelve una sola línea.
