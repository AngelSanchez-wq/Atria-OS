import { Tarea, TareaGestionada } from '../types';

/**
 * Plantillas de tareas iniciales. Se copian una sola vez a cada usuario en su
 * primer ingreso (con ids nuevos y su usuarioId). Las duraciones están dentro
 * de DURACIONES_PERMITIDAS para que se puedan editar sin errores.
 */
export const TAREAS_SEMILLA: Tarea[] = [
  {
    id: 't1',
    titulo: 'Escribir borrador del informe',
    app: 'focuspad',
    minutos: 15,
    etiqueta: 'estudio',
  },
  {
    id: 't2',
    titulo: 'Organizar archivos de la semana',
    app: 'tagfs',
    minutos: 10,
    etiqueta: 'limpieza',
  },
  {
    id: 't3',
    titulo: 'Planear el día de mañana',
    app: 'timelapse',
    minutos: 10,
    etiqueta: 'organización',
  },
  {
    id: 't4',
    titulo: 'Respiración de transición',
    app: 'burble',
    minutos: 10,
    etiqueta: 'bienestar',
  },
  {
    id: 't5',
    titulo: 'Escuchar ruido de lluvia',
    app: 'ambient',
    minutos: 25,
    etiqueta: 'enfoque',
  },
];

/**
 * Crea copias de las semillas para un usuario.
 * `crearId` y `ahora` se inyectan para mantener la función pura y comprobable.
 * Cada copia recibe un instante consecutivo para conservar el orden de antigüedad.
 */
export function instanciarSemillas(
  usuarioId: string,
  ahora: number,
  crearId: (indice: number) => string,
  semillas: readonly Tarea[] = TAREAS_SEMILLA
): TareaGestionada[] {
  return semillas.map((s, indice) => ({
    ...s,
    id: crearId(indice),
    usuarioId,
    importante: s.importante ?? false,
    estado: 'pendiente',
    creadaEn: ahora + indice,
  }));
}
