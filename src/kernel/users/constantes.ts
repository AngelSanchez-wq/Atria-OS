import { IdApp, LimitesUsuario } from '../types';
import { MEMORIA_TOTAL_MB } from '../processes/constantes';

/** Límites válidos para tareas concurrentes por usuario. */
export const MIN_TAREAS_ACTIVAS = 1;
export const MAX_TAREAS_ACTIVAS = 5;
export const CUPO_TAREAS_POR_DEFECTO = 3;

/** Límites válidos de memoria individual por perfil (MB). */
export const MIN_MEMORIA_USUARIO_MB = 256;
export const MAX_MEMORIA_USUARIO_MB = MEMORIA_TOTAL_MB; // 2048 MB
export const MEMORIA_MAXIMA_USUARIO_DEFAULT = 1024;

/** Lista de todas las aplicaciones disponibles en el sistema. */
export const TODAS_LAS_APPS: IdApp[] = [
  'focuspad',
  'timelapse',
  'tagfs',
  'burble',
  'ambient',
  'monitor',
];

/** Límites asignados por defecto al crear un nuevo perfil de usuario. */
export const LIMITES_USUARIO_POR_DEFECTO: LimitesUsuario = {
  appsHabilitadas: [...TODAS_LAS_APPS],
  maxTareasActivas: CUPO_TAREAS_POR_DEFECTO,
  memoriaMaximaMb: MEMORIA_MAXIMA_USUARIO_DEFAULT,
};

/** Motivos estándar de error para operaciones de gestión de usuarios en el kernel. */
export const MOTIVOS_ERROR_USUARIOS = {
  ACTOR_NO_ADMIN: 'actor-no-admin',
  NOMBRE_VACIO: 'nombre-vacio',
  NOMBRE_DUPLICADO: 'nombre-duplicado',
  PIN_INVALIDO: 'pin-invalido',
  USUARIO_NO_EXISTE: 'usuario-no-existe',
  ULTIMO_ADMIN_ACTIVO: 'ultimo-admin-activo',
  AUTO_BLOQUEO_NO_PERMITIDO: 'auto-bloqueo-no-permitido',
  LIMITES_INVALIDOS: 'limites-invalidos',
} as const;

/** Motivos de rechazo de apertura de apps evaluados por el kernel. */
export const MOTIVOS_RECHAZO_APP = {
  APP_DESHABILITADA: 'app-deshabilitada',
  MEMORIA_INSUFICIENTE: 'memoria-insuficiente',
} as const;
