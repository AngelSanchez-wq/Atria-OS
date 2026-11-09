import { PCB } from '../types';

/**
 * Estado inmutable del planificador de procesos simulado.
 */
export type EstadoPlanificador = {
  /**
   * PID del proceso que está ejecutando actualmente en la CPU simulada.
   * `null` indica que la CPU está ociosa (ningún proceso listo compitiendo).
   * Nota: El proceso del Kernel (PID 1) no ocupa este puesto porque corre
   * de forma permanente como infraestructura base del sistema.
   */
  procesoEnCpuPid: number | null;
  /** Contador global de ticks simulados transcurridos. */
  ticks: number;
  /**
   * Contador de cambios de contexto entre procesos distintos.
   * No se incrementa al pasar de ocioso a ejecutar el primer proceso,
   * ni cuando el mismo proceso continúa o renueva su quantum sin alternar.
   */
  cambiosContexto: number;
};

/**
 * Resultado devuelto por la función pura de avance de tick del planificador.
 */
export type ResultadoTick = {
  /** Nuevo estado del planificador con los contadores y CPU actualizados. */
  nuevoEstado: EstadoPlanificador;
  /** Lista completa de procesos con sus estados, quantums y prioridades efectivas recalculadas. */
  procesosActualizados: PCB[];
};
