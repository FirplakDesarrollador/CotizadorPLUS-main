type ClienteRpc = {
  rpc: (nombre: string, argumentos: Record<string, unknown>) => PromiseLike<{
    data: unknown;
    error: { message?: string } | null;
  }>;
};

export async function resolverTipologiaFondo<T extends { tipoId: string; conFondo?: boolean }>(
  cliente: ClienteRpc,
  input: T,
): Promise<T> {
  const { data, error } = await cliente.rpc('cot_resolver_tipologia_fondo', {
    p_tipo_actual: input.tipoId,
    p_con_fondo: input.conFondo !== false,
  });
  if (error || !data) throw new Error(error?.message ?? 'No se pudo resolver la tipología de fondo');
  return { ...input, tipoId: String(data) };
}
