/**
 * Constantes y parámetros de configuración del planificador de procesos simulado.
 */

/** Quantum base por defecto asignado a los procesos normales (en ticks simulados). */
export const QUANTUM_BASE_TICKS = 3;

/** Quantum extendido asignado al proceso que posee la ventana enfocada (en ticks simulados). */
export const QUANTUM_FOCO_TICKS = 6;

/**
 * Cantidad de ticks esperando en la cola de Listos necesarios para acumular
 * +1 en la bonificación de prioridad por envejecimiento (previene inanición).
 */
export const ENVEJECIMIENTO_CADA_TICKS = 3;

/** Bonificación de prioridad sumada al proceso asociado a la ventana en foco activo. */
export const BONUS_FOCO = 2;

/** Límite superior máximo que puede alcanzar cualquier prioridad (base o efectiva). */
export const PRIORIDAD_MAXIMA = 10;

/** Duración en milisegundos de un tick simulado a velocidad normal (×1). */
export const INTERVALO_TICK_MS = 1000;

/** Multiplicadores de velocidad de simulación permitidos por el motor. */
export const VELOCIDADES_PLANIFICADOR = [1, 5, 10] as const;
export type VelocidadPlanificador = (typeof VELOCIDADES_PLANIFICADOR)[number];

/** Procesos de prueba predeterminados para la demostración del planificador. */
export const PROCESOS_DEMO = [
  { nombre: 'Demo A', prioridad: 3, memoriaMb: 20 },
  { nombre: 'Demo B', prioridad: 5, memoriaMb: 20 },
  { nombre: 'Demo C', prioridad: 9, memoriaMb: 20 },
] as const;
