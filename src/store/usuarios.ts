import { create } from 'zustand';
import { LimitesUsuario, RolUsuario, Usuario } from '../kernel/types';
import { USUARIOS_SEMILLA } from '../kernel/users/usuarios-semilla';
import { TODAS_LAS_APPS } from '../kernel/users/constantes';
import {
  crearUsuario as opCrearUsuario,
  bloquearUsuario as opBloquearUsuario,
  desbloquearUsuario as opDesbloquearUsuario,
  cambiarRol as opCambiarRol,
  actualizarLimites as opActualizarLimites,
  cambiarFoto as opCambiarFoto,
  quitarFoto as opQuitarFoto,
  DatosCrearUsuario,
  ResultadoOperacionUsuario,
} from '../kernel/users/operaciones';
import { platform } from '../platform/web';
import { registrar } from '../system/logging/servicio';
import { useSesion } from './sesion';

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
        appsHabilitadas: [...TODAS_LAS_APPS],
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
  cambiarFoto: (
    actor: Usuario,
    usuarioId: string,
    dataUrl: string
  ) => ResultadoOperacionUsuario;
  quitarFoto: (actor: Usuario, usuarioId: string) => ResultadoOperacionUsuario;
  actualizarUltimoAcceso: (usuarioId: string, instante?: number) => void;
  restablecer: () => void;
};

export const useUsuariosStore = create<UsuariosStore>((set, get) => ({
  usuarios: usuariosIniciales,

  crearUsuario: (actor, datos) => {
    const { usuarios } = get();
    const resultado = opCrearUsuario(actor, usuarios, datos);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      registrar({
        categoria: 'seguridad',
        gravedad: 'info',
        mensaje: `Usuario creado: ${resultado.usuario.nombre} (${resultado.usuario.rol}) por ${actor.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  bloquearUsuario: (actor, usuarioId) => {
    const { usuarios } = get();
    const resultado = opBloquearUsuario(actor, usuarios, usuarioId);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: `Usuario bloqueado: ${resultado.usuario.nombre} por ${actor.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  desbloquearUsuario: (actor, usuarioId) => {
    const { usuarios } = get();
    const resultado = opDesbloquearUsuario(actor, usuarios, usuarioId);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      registrar({
        categoria: 'seguridad',
        gravedad: 'info',
        mensaje: `Usuario desbloqueado: ${resultado.usuario.nombre} por ${actor.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  cambiarRol: (actor, usuarioId, nuevoRol) => {
    const { usuarios } = get();
    const resultado = opCambiarRol(actor, usuarios, usuarioId, nuevoRol);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: `Rol cambiado a ${nuevoRol} para ${resultado.usuario.nombre} por ${actor.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  actualizarLimites: (actor, usuarioId, nuevosLimites) => {
    const { usuarios } = get();
    const resultado = opActualizarLimites(actor, usuarios, usuarioId, nuevosLimites);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      registrar({
        categoria: 'seguridad',
        gravedad: 'info',
        mensaje: `Límites actualizados para ${resultado.usuario.nombre} por ${actor.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  cambiarFoto: (actor, usuarioId, dataUrl) => {
    const { usuarios } = get();
    const resultado = opCambiarFoto(actor, usuarios, usuarioId, dataUrl);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      const sesionActual = useSesion.getState().usuario;
      if (sesionActual && sesionActual.id === usuarioId) {
        useSesion.setState({ usuario: resultado.usuario });
      }

      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: `Foto de perfil actualizada para ${resultado.usuario.nombre}`,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  quitarFoto: (actor, usuarioId) => {
    const { usuarios } = get();
    const resultado = opQuitarFoto(actor, usuarios, usuarioId);

    if (resultado.ok) {
      set({ usuarios: resultado.usuarios });
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, resultado.usuarios);

      const sesionActual = useSesion.getState().usuario;
      if (sesionActual && sesionActual.id === usuarioId) {
        useSesion.setState({ usuario: resultado.usuario });
      }

      const mensaje =
        actor.id !== usuarioId && actor.rol === 'admin'
          ? `Foto de perfil quitada para ${resultado.usuario.nombre} por el administrador ${actor.nombre}`
          : `Foto de perfil quitada para ${resultado.usuario.nombre}`;

      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje,
        usuarioId: actor.id,
      });
    }

    return resultado;
  },

  actualizarUltimoAcceso: (usuarioId, instante = Date.now()) => {
    set((state) => {
      const actualizados = state.usuarios.map((u) =>
        u.id === usuarioId ? { ...u, ultimoAcceso: instante } : u
      );
      platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, actualizados);
      return { usuarios: actualizados };
    });
  },

  restablecer: () => {
    set({ usuarios: USUARIOS_SEMILLA });
    platform.saveState(CLAVE_PERSISTENCIA_USUARIOS, USUARIOS_SEMILLA);
  },
}));
