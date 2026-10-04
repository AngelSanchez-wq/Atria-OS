import { Tarea } from '../types';

/**
 * Retorna la siguiente tarea de forma circular, sin repetir la actual inmediatamente.
 * Si el índice actual es mayor al número de tareas, comienza desde cero.
 */
export function siguienteSugerencia(tareas: Tarea[], indiceActual: number): number {
  if (!tareas || tareas.length === 0) return 0;
  return (indiceActual + 1) % tareas.length;
}
