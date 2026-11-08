/**
 * Lógica pura para el cálculo del volumen efectivo en el sistema operativo.
 */

/**
 * Calcula el volumen efectivo de reproducción de un sonido en el sistema.
 * Regla: El volumen efectivo de Ambient es su volumen propio × el maestro, y con silencio es 0.
 *
 * @param volumenPropio Nivel propio del sonido o app (de 0 a 1)
 * @param volumenMaestro Nivel maestro del sistema (de 0 a 1)
 * @param silenciado Si el sistema o el sonido se encuentra silenciado
 * @returns Nivel de volumen efectivo acotado entre 0 y 1
 */
export function calcularVolumenEfectivo(
  volumenPropio: number,
  volumenMaestro: number,
  silenciado: boolean
): number {
  if (silenciado) {
    return 0;
  }

  const propio = Math.max(0, Math.min(1, volumenPropio));
  const maestro = Math.max(0, Math.min(1, volumenMaestro));

  // Redondeo a 4 decimales para evitar imprecisiones de coma flotante
  return Math.round(propio * maestro * 10000) / 10000;
}
