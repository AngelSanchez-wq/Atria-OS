import { Tarea } from '../types';

export type ResultadoSugerencia<T extends Tarea = Tarea> = {
  tarea: T | null;
  esImportante: boolean;
};

/**
 * Ordena las tareas para sugerirlas: primero las importantes y, dentro de cada
 * grupo, de la más antigua a la más reciente. Si empatan, conserva el orden original.
 * No modifica el arreglo recibido.
 */
export function ordenarSugerencias<T extends Tarea>(tareas: readonly T[]): T[] {
  return tareas
    .map((tarea, indice) => ({ tarea, indice }))
    .sort((a, b) => {
      const impA = a.tarea.importante ? 1 : 0;
      const impB = b.tarea.importante ? 1 : 0;
      if (impA !== impB) return impB - impA;
      const difAntiguedad = (a.tarea.creadaEn ?? 0) - (b.tarea.creadaEn ?? 0);
      if (difAntiguedad !== 0) return difAntiguedad;
      return a.indice - b.indice;
    })
    .map((x) => x.tarea);
}

/**
 * Calcula la siguiente sugerencia a partir de la actual.
 * - Sin tareas: { tarea: null, esImportante: false }.
 * - Si hay importantes, solo se recorren entre ellas. Con una sola importante,
 *   NO se salta: se devuelve la misma con { esImportante: true }.
 * - Sin importantes: rota de forma circular entre todas, en el orden de
 *   `ordenarSugerencias`.
 * - Si `actualId` es null o no está en el grupo, se devuelve la primera del grupo.
 */
export function siguienteSugerencia<T extends Tarea>(
  tareas: readonly T[],
  actualId: string | null
): ResultadoSugerencia<T> {
  if (!tareas || tareas.length === 0) return { tarea: null, esImportante: false };

  const ordenadas = ordenarSugerencias(tareas);
  const importantes = ordenadas.filter((t) => t.importante);
  const grupo = importantes.length > 0 ? importantes : ordenadas;
  const esImportante = importantes.length > 0;

  const indiceActual = grupo.findIndex((t) => t.id === actualId);
  if (indiceActual === -1) return { tarea: grupo[0], esImportante };

  return { tarea: grupo[(indiceActual + 1) % grupo.length], esImportante };
}
