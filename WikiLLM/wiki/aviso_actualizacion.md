# Aviso de nueva versión

`src/components/AvisoActualizacion.tsx` muestra una barra ámbar en la parte superior de todas las pantallas para avisar a quienes están usando la aplicación que hay una versión nueva.

## Mensaje

> Hola, existe una nueva versión, por favor actualiza

La barra incluye dos acciones:

- **Actualizar ahora**: marca el aviso como visto y recarga la página (`window.location.reload()`) para cargar la versión publicada.
- **×**: cierra el aviso y lo marca como visto.

## Comportamiento

- El componente se monta en `src/app/layout.tsx`, antes de `children`, por lo que aplica a todas las rutas (login, simulador, cotizaciones, HDR, optimizador, admin y manual).
- En el primer render devuelve `null`; el aviso se muestra desde `useEffect` para evitar desajustes de hidratación.
- El estado «visto» se guarda en `localStorage` con la clave `cotizador-plus:aviso-version:<AVISO_VERSION>`.
- Si el navegador bloquea `localStorage`, el aviso se muestra igual y se oculta solo en la vista actual.
- Para volver a mostrar el mensaje en una publicación futura basta con cambiar la constante `AVISO_VERSION` del componente.

## Alcance

El aviso no modifica datos, sesiones, cotizaciones ni la base de datos. Es puramente informativo y no bloquea la navegación.
