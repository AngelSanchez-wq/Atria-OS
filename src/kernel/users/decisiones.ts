import { AppId, PCB, Usuario } from '../types';
import { CONFIG_PROCESO, MEMORIA_TOTAL_MB } from '../processes/constantes';
import {
  CUPO_TAREAS_POR_DEFECTO,
  MEMORIA_MAXIMA_USUARIO_DEFAULT,
  MOTIVOS_RECHAZO_APP,
} from './constantes';

export type ResultadoDecisionApertura =
  | { ok: true }
  | { ok: false; motivo: (typeof MOTIVOS_RECHAZO_APP)[keyof typeof MOTIVOS_RECHAZO_APP] };

/**
 * Determina si un usuario puede abrir una aplicación específica en base a:
 * 1. Sus aplicaciones habilitadas en su perfil.
 * 2. Su cupo de memoria asignado (frente a los procesos vivos de ese usuario).
 * 3. La memoria total física disponible del sistema.
 */
export function puedeAbrirApp(
  usuario: Usuario | null,
  idApp: AppId,
  procesos: readonly PCB[]
): ResultadoDecisionApertura {
  // La app de configuración del sistema es una utilidad accesible para todos los perfiles
  if (usuario && idApp !== 'configuracion') {
    if (!usuario.limites.appsHabilitadas.includes(idApp)) {
      return { ok: false, motivo: MOTIVOS_RECHAZO_APP.APP_DESHABILITADA };
    }
  }

  const configApp = CONFIG_PROCESO[idApp];
  const memoriaRequerida = configApp ? configApp.memoriaMb : 64;

  // 1. Memoria usada por los procesos del usuario actual
  if (usuario) {
    const procesosDelUsuario = procesos.filter(
      (p) => p.usuarioId === usuario.id && p.estado !== 'Terminado'
    );
    const memoriaUsadaPorUsuario = procesosDelUsuario.reduce(
      (total, p) => total + p.memoriaMb,
      0
    );
    const limiteMemoriaUsuario =
      usuario.limites.memoriaMaximaMb ?? MEMORIA_MAXIMA_USUARIO_DEFAULT;

    if (memoriaUsadaPorUsuario + memoriaRequerida > limiteMemoriaUsuario) {
      return { ok: false, motivo: MOTIVOS_RECHAZO_APP.MEMORIA_INSUFICIENTE };
    }
  }

  // 2. Memoria total global del sistema
  const procesosVivosSistema = procesos.filter((p) => p.estado !== 'Terminado');
  const memoriaTotalUsada = procesosVivosSistema.reduce(
    (total, p) => total + p.memoriaMb,
    0
  );

  if (memoriaTotalUsada + memoriaRequerida > MEMORIA_TOTAL_MB) {
    return { ok: false, motivo: MOTIVOS_RECHAZO_APP.MEMORIA_INSUFICIENTE };
  }

  return { ok: true };
}

/** Retorna el cupo máximo de tareas activas para el perfil del usuario. */
export function cupoDeTareas(usuario: Usuario | null): number {
  if (!usuario) return CUPO_TAREAS_POR_DEFECTO;
  return usuario.limites.maxTareasActivas ?? CUPO_TAREAS_POR_DEFECTO;
}

/**
 * Determina si el usuario puede iniciar sesión.
 * Falso si su cuenta ha sido bloqueada por el administrador.
 */
export function puedeIniciarSesion(usuario: Usuario): boolean {
  return usuario.estado !== 'bloqueado';
}
