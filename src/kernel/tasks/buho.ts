export type ContextoBuho = {
  tieneTareaActiva: boolean;
  estadoTarea?: 'en-curso' | 'pausada';
  enLogro?: boolean;
};

export type EstadoBuho = 'reposo' | 'foco' | 'logro';

/**
 * Calcula el estado del búho según el contexto actual del sistema y la tarea activa.
 * - Si está en pantalla de logro -> 'logro'
 * - Si no hay tarea activa -> 'reposo'
 * - Si la tarea está pausada -> 'reposo'
 * - Si la tarea está en curso -> 'foco'
 */
export function estadoBuho(contexto: ContextoBuho): EstadoBuho {
  if (contexto.enLogro) {
    return 'logro';
  }
  if (!contexto.tieneTareaActiva) {
    return 'reposo';
  }
  if (contexto.estadoTarea === 'pausada') {
    return 'reposo';
  }
  return 'foco';
}
