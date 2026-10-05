import { AppId } from '../types';

/** Memoria total simulada disponible en el sistema (en MB). */
export const MEMORIA_TOTAL_MB = 2048;

/**
 * Prioridad (1-10, donde 10 es la más alta) y memoria reservada por app.
 * Zenpen y Pomofocus tienen mayor prioridad por ser herramientas de foco.
 */
export const CONFIG_PROCESO: Record<AppId, { prioridad: number; memoriaMb: number }> = {
  focuspad:  { prioridad: 8, memoriaMb: 256 }, // ZenPen: editor de foco principal
  timelapse: { prioridad: 7, memoriaMb: 192 }, // Pomofocus: temporizador
  tagfs:     { prioridad: 4, memoriaMb: 128 }, // Gestor de archivos local
  burble:    { prioridad: 3, memoriaMb: 64  }, // App propia (en construcción)
  ambient:   { prioridad: 1, memoriaMb: 48  }, // Sonidos de fondo
};
