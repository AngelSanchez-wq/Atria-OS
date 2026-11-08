export function formatearTiempo(segundosTotales: number): string {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = Math.floor(segundosTotales % 60);
  const minStr = minutos.toString().padStart(2, '0');
  const segStr = segundos.toString().padStart(2, '0');
  return `${minStr}:${segStr}`;
}

/**
 * Calcula los minutos enfocados a partir de los segundos transcurridos.
 * Redondea hacia abajo y devuelve como mínimo 1 minuto.
 */
export function minutosEnfocados(segundosTranscurridos: number): number {
  const minutos = Math.floor(segundosTranscurridos / 60);
  return Math.max(1, minutos);
}

