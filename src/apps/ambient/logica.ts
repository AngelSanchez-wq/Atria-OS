import { SonidoId } from './sonidos';

/**
 * Determina el siguiente sonido al pulsar un botón.
 * Si el sonido pulsado ya está activo, se detiene (retorna null).
 * Si se pulsa otro sonido o no había ninguno activo, se activa el nuevo sonido.
 */
export function alternarSonido(
  sonidoActual: SonidoId | null,
  sonidoPulsado: SonidoId
): SonidoId | null {
  if (sonidoActual === sonidoPulsado) {
    return null;
  }
  return sonidoPulsado;
}
