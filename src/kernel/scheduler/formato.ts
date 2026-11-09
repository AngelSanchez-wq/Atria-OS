/**
 * Funciones puras de formato para métricas del planificador simulado.
 */

/**
 * Convierte una cantidad de ticks (segundos simulados) al formato de tiempo mm:ss.
 * 
 * Ejemplos:
 * - 0   -> '00:00'
 * - 59  -> '00:59'
 * - 60  -> '01:00'
 * - 155 -> '02:35' (como en el mockup)
 */
export function formatearTiempoSimulado(ticks: number): string {
  const totalSegundos = Math.max(0, Math.floor(Number.isFinite(ticks) ? ticks : 0));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  const mm = minutos.toString().padStart(2, '0');
  const ss = segundos.toString().padStart(2, '0');

  return `${mm}:${ss}`;
}
