/**
 * Intervalo entre revisiones periódicas por lotes de notificaciones.
 * Para efectos de la demostración e interactividad rápida, se define en 2 minutos (120 000 ms).
 * En un escenario de producción o uso real, este intervalo suele configurarse entre 30 y 60 minutos
 * para maximizar los bloques de trabajo profundo sin interrupción.
 */
export const INTERVALO_REVISION_MS = 2 * 60 * 1000;

/**
 * Frecuencia con la que el simulador emite nuevas notificaciones mientras la sesión está activa.
 */
export const INTERVALO_SIMULADOR_MS = 15 * 1000;

/**
 * Cantidad tope de notificaciones simuladas que se generarán durante la sesión.
 */
export const MAXIMO_NOTIFICACIONES_SIMULADAS = 10;

/**
 * Tiempo de permanencia visible del banner de aviso urgente en pantalla antes de descartarse
 * (reservado para la interfaz en la Entrega 2).
 */
export const DURACION_AVISO_URGENTE_MS = 5 * 1000;
