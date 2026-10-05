export function formatearTiempo(segundosTotales: number): string {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = Math.floor(segundosTotales % 60);
  const minStr = minutos.toString().padStart(2, '0');
  const segStr = segundos.toString().padStart(2, '0');
  return `${minStr}:${segStr}`;
}
