/**
 * Constantes de la gestión de tareas por usuario.
 * El cupo de tareas activas NO vive aquí: sale de los límites de cada usuario
 * (`limites.maxTareasActivas`).
 */

/** Longitud máxima del título de una tarea (tras recortar espacios). */
export const LONGITUD_MAX_TITULO = 60;

/** Longitud máxima de la etiqueta de una tarea (ya normalizada). */
export const LONGITUD_MAX_ETIQUETA = 20;

/** Duraciones (en minutos) que se pueden elegir para una tarea. */
export const DURACIONES_PERMITIDAS = [10, 15, 25, 45, 60] as const;

/** Máximo de tareas sin terminar (pendientes, en curso o pausadas) por usuario. */
export const MAXIMO_TAREAS_PENDIENTES = 15;

/** Etiqueta que se usa cuando la tarea llega sin etiqueta. */
export const ETIQUETA_POR_DEFECTO = 'general';

/** Clave de persistencia de las tareas por usuario. */
export const CLAVE_PERSISTENCIA_TAREAS = 'atria_tareas';

/** Versión del formato persistido (para migrar datos antiguos). */
export const VERSION_DATOS_TAREAS = 2;

/** Motivos estándar de error de las operaciones de tareas. */
export const MOTIVOS_ERROR_TAREAS = {
  TITULO_VACIO: 'titulo-vacio',
  TITULO_MUY_LARGO: 'titulo-muy-largo',
  APP_NO_HABILITADA: 'app-no-habilitada',
  DURACION_INVALIDA: 'duracion-invalida',
  ETIQUETA_INVALIDA: 'etiqueta-invalida',
  ETIQUETA_MUY_LARGA: 'etiqueta-muy-larga',
  TAREA_NO_EXISTE: 'tarea-no-existe',
  NO_ES_DUENO: 'no-es-dueno',
  TAREA_EN_USO: 'tarea-en-uso',
  TAREA_YA_HECHA: 'tarea-ya-hecha',
  MAXIMO_PENDIENTES: 'maximo-pendientes',
  SIN_SESION: 'sin-sesion',
} as const;

export type MotivoErrorTarea =
  (typeof MOTIVOS_ERROR_TAREAS)[keyof typeof MOTIVOS_ERROR_TAREAS];

/**
 * Textos en lenguaje sencillo para cada motivo.
 * TODO (Entrega 2): mostrarlos en las pantallas de gestión de tareas.
 */
export const TEXTOS_MOTIVOS_TAREAS: Record<MotivoErrorTarea, string> = {
  'titulo-vacio': 'Escribe un título para la tarea.',
  'titulo-muy-largo': `El título puede tener como máximo ${LONGITUD_MAX_TITULO} caracteres.`,
  'app-no-habilitada': 'Esta app no está habilitada para tu perfil.',
  'duracion-invalida': 'Elige una de las duraciones disponibles.',
  'etiqueta-invalida': 'La etiqueta solo puede tener letras, números, guiones o guiones bajos.',
  'etiqueta-muy-larga': `La etiqueta puede tener como máximo ${LONGITUD_MAX_ETIQUETA} caracteres.`,
  'tarea-no-existe': 'La tarea ya no existe.',
  'no-es-dueno': 'Solo puedes cambiar tus propias tareas.',
  'tarea-en-uso': 'No puedes cambiar una tarea en curso o en pausa.',
  'tarea-ya-hecha': 'Esta tarea ya está hecha.',
  'maximo-pendientes': `Puedes tener como máximo ${MAXIMO_TAREAS_PENDIENTES} tareas sin terminar.`,
  'sin-sesion': 'Necesitas iniciar sesión.',
};
