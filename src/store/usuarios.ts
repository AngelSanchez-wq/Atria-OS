import { create } from 'zustand';
import { LimitesUsuario, RolUsuario, Usuario } from '../kernel/types';
import { USUARIOS_SEMILLA } from '../kernel/users/usuarios-semilla';
import {
  crearUsuario as opCrearUsuario,
  bloquearUsuario as opBloquearUsuario,
  desbloquearUsuario as opDesbloquearUsuario,
  cambiarRol as opCambiarRol,
  actualizarLimites as opActualizarLimites,
  DatosCrearUsuario,
  ResultadoOperacionUsuario,
} from '../kernel/users/operaciones';
import { platform } from '../platform/web';
import { registrar } from '../system/logging/servicio';

export const CLAVE_PERSISTENCIA_USUARIOS = 'atria_usuarios';

// Carga inicial persistida o semillas por defecto
const usuariosPersistidos = platform.loadState<Usuario[]>(
  CLAVE_PERSISTENCIA_USUARIOS,
  USUARIOS_SEMILLA
);

// Asegura que los usuarios persistidos contengan los campos nuevos de la estructura
const usuariosIniciales: Usuario[] = Array.isArray(usuariosPersistidos) && usuariosPersistidos.length > 0
  ? usuariosPersistidos.map((u) => ({
      ...u,
      estado: u.estado ?? 'activo',
      ultimoAcceso: u.ultimoAcceso ?? null,
      limites: u.limites ?? {
        appsHabilitadas: ['focuspad', 'timelapse', 'tagfs', 'burble', 'ambient', 'monitor', 'configuracion'],
        maxTareasActivas: 3,
        memoriaMaximaMb: 1024,
      },
    }))
  : USUARIOS_SEMILLA;

export type UsuariosStore = {
  usuarios: Usuario[];
  crearUsuario: (actor: Usuario, datos: DatosCrearUsuario) => ResultadoOperacionUsuario;
  bloquearUsuario: (actor: Usuario, usuarioId: string) => ResultadoOperacionUsuario;
  desbloquearUsuario: (actor: Usuario, usuarioId: string) => ResultadoOperacionUsuario;
  cambiarRol: (actor: Usuario, usuarioId: string, nuevoRol: RolUsuario) => ResultadoOperacionUsuario;
  actualizarLimites: (
    actor: Usuario,
    usuarioId: string,
    nuevosLimites: Partial<LimitesUsuario>
  ) => ResultadoOperacionUsuario;
  actualizarUltimoAcceso: (usuarioId: string, instante?: number) => void;
  restablecer: () => void;
};

export const useUsuariosStore = create<UsuariosStore>((set, get) => ({
  usuarios: usuariosIniciales,

  crearUsuario: (actor, datos) => {
    const res = opCrearUsuario(actor, get().usuarios, datos);
    if (!res.ok) {
      return res;
    }

    set({ usuarios: res.usuarios });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, res.usuarios);

    // Auditoría de seguridad (sin registrar nunca el PIN)
    registrar({
      categoria: 'seguridad',
      gravedad: 'info',
      mensaje: `Usuario creado: ${res.usuario.nombre} (rol: ${res.usuario.rol})`,
      usuarioId: actor.id,
    });

    return res;
  },

  bloquearUsuario: (actor, usuarioId) => {
    const res = opBloquearUsuario(actor, get().usuarios, usuarioId);
    if (!res.ok) {
      return res;
    }

    set({ usuarios: res.usuarios });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, res.usuarios);

    registrar({
      categoria: 'seguridad',
      gravedad: 'aviso',
      mensaje: `Usuario bloqueado: ${res.usuario.nombre}`,
      usuarioId: actor.id,
    });

    return res;
  },

  desbloquearUsuario: (actor, usuarioId) => {
    const res = opDesbloquearUsuario(actor, get().usuarios, usuarioId);
    if (!res.ok) {
      return res;
    }

    set({ usuarios: res.usuarios });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, res.usuarios);

    registrar({
      categoria: 'seguridad',
      gravedad: 'info',
      mensaje: `Usuario desbloqueado: ${res.usuario.nombre}`,
      usuarioId: actor.id,
    });

    return res;
  },

  cambiarRol: (actor, usuarioId, nuevoRol) => {
    const res = opCambiarRol(actor, get().usuarios, usuarioId, nuevoRol);
    if (!res.ok) {
      return res;
    }

    set({ usuarios: res.usuarios });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, res.usuarios);

    registrar({
      categoria: 'seguridad',
      gravedad: 'info',
      mensaje: `Rol de ${res.usuario.nombre} cambiado a ${nuevoRol}`,
      usuarioId: actor.id,
    });

    return res;
  },

  actualizarLimites: (actor, usuarioId, nuevosLimites) => {
    const res = opActualizarLimites(actor, get().usuarios, usuarioId, nuevosLimites);
    if (!res.ok) {
      return res;
    }

    set({ usuarios: res.usuarios });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, res.usuarios);

    registrar({
      categoria: 'seguridad',
      gravedad: 'info',
      mensaje: `Límites actualizados para ${res.usuario.nombre}`,
      usuarioId: actor.id,
    });

    return res;
  },

  actualizarUltimoAcceso: (usuarioId, instante = Date.now()) => {
    set((state) => {
      const listaActualizada = state.usuarios.map((u) =>
        u.id === usuarioId ? { ...u, ultimoAcceso: instante } : u
      );
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, listaActualizada);
      return { usuarios: listaActualizada };
    });
  },

  restablecer: () => {
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, USUARIOS_SEMILLA);
    set({ usuarios: USUARIOS_SEMILLA });
  },
}));
