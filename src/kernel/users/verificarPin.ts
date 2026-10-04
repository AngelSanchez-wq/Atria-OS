import type { Usuario } from '../types';

/** Comprueba si el PIN coincide con el del usuario (comparación pura). */
export function verificarPin(usuario: Usuario, pin: string): boolean {
  return usuario.pin === pin;
}
