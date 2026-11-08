import { IdApp, LimitesUsuario } from '../types';
import { CUPO_MAXIMO_TAREAS } from '../../config/escritorio';
import { MEMORIA_TOTAL_MB } from '../processes/constantes';

export const TODAS_LAS_APPS: IdApp[] = [
  'focuspad',
  'timelapse',
  'tagfs',
  'burble',
  'ambient',
  'monitor',
  'configuracion',
];

/** Tareas simultáneas por defecto (el valor histórico de CUPO_MAXIMO_TAREAS). */
export const CUPO_TAREAS_POR_DEFECTO = CUPO_MAXIMO_TAREAS;

/** Memoria RAM máxima por usuario por defecto (1024 MB). */
export const MEMORIA_MAXIMA_USUARIO_DEFAULT = 1024;

/** Rangos válidos para configuración de límites por perfil */
export const MIN_TAREAS_ACTIVAS = 1;
export const MAX_TAREAS_ACTIVAS = 5;
export const MIN_MEMORIA_USUARIO_MB = 256;
export const MAX_MEMORIA_USUARIO_MB = MEMORIA_TOTAL_MB; // 2048 MB

export const LIMITES_USUARIO_POR_DEFECTO: LimitesUsuario = {
  appsHabilitadas: [...TODAS_LAS_APPS],
  maxTareasActivas: CUPO_TAREAS_POR_DEFECTO,
  memoriaMaximaMb: MEMORIA_MAXIMA_USUARIO_DEFAULT,
};

export const MOTIVOS_ERROR_USUARIOS = {
  ACTOR_NO_ADMIN: 'actor-no-admin',
  NOMBRE_VACIO: 'nombre-vacio',
  NOMBRE_DUPLICADO: 'nombre-duplicado',
  PIN_INVALIDO: 'pin-invalido',
  USUARIO_NO_ENCONTRADO: 'usuario-no-encontrado',
  AUTO_BLOQUEO_NO_PERMITIDO: 'auto-bloqueo-no-permitido',
  ULTIMO_ADMINISTRADOR: 'ultimo-administrador',
  LIMITES_FUERA_DE_RANGO: 'limites-fuera-de-rango',
} as const;

export const MOTIVOS_RECHAZO_APP = {
  APP_DESHABILITADA: 'app-deshabilitada',
  MEMORIA_INSUFICIENTE: 'memoria-insuficiente',
} as const;
