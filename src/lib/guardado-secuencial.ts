/** Serializa los cambios de características para que una petición antigua no gane a la última. */
export function crearGuardadoSecuencial<T>(
  guardar: (valor: T) => Promise<void>,
  onEstado: (pendientes: number, error: string | null) => void = () => {},
) {
  let cola: Promise<void> = Promise.resolve();
  let pendientes = 0;
  return async (valor: T): Promise<void> => {
    const copia = structuredClone(valor);
    pendientes++;
    onEstado(pendientes, null);
    const operacion = cola.then(() => guardar(copia));
    // Recupera la cola, pero la promesa devuelta conserva el error para el usuario.
    cola = operacion.catch(() => {});
    try {
      await operacion;
      pendientes--;
      onEstado(pendientes, null);
    } catch (error) {
      pendientes--;
      onEstado(pendientes, error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
}
