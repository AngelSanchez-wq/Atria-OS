import { describe, it, expect } from 'vitest';
import { Usuario } from '../types';
import {
  crearUsuario,
  bloquearUsuario,
  desbloquearUsuario,
  cambiarRol,
  actualizarLimites,
} from './operaciones';
import {
  LIMITES_USUARIO_POR_DEFECTO,
  MOTIVOS_ERROR_USUARIOS,
} from './constantes';

const adminActivo: Usuario = {
  id: 'admin-1',
  nombre: 'Admin Master',
  inicial: 'A',
  rol: 'admin',
  pin: '0000',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

const adminSecundario: Usuario = {
  id: 'admin-2',
  nombre: 'Admin Aux',
  inicial: 'A',
  rol: 'admin',
  pin: '1111',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

const usuarioEstandar: Usuario = {
  id: 'user-1',
  nombre: 'Mateo',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

describe('Operaciones puras de administración de usuarios', () => {
  describe('Validación del Actor', () => {
    it('falla si el actor no tiene rol admin', () => {
      const res = crearUsuario(usuarioEstandar, [adminActivo, usuarioEstandar], {
        nombre: 'Nuevo',
        pin: '4321',
        rol: 'estandar',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN);
      }
    });

    it('falla si el actor es admin pero su cuenta está bloqueada', () => {
      const adminBloqueado: Usuario = { ...adminActivo, estado: 'bloqueado' };
      const res = bloquearUsuario(adminBloqueado, [adminBloqueado, usuarioEstandar], 'user-1');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN);
      }
    });
  });

  describe('crearUsuario', () => {
    it('crea un usuario válido con ID y límites por defecto', () => {
      const res = crearUsuario(adminActivo, [adminActivo, usuarioEstandar], {
        nombre: 'Valery',
        pin: '9876',
        rol: 'estandar',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.nombre).toBe('Valery');
        expect(res.usuario.inicial).toBe('V');
        expect(res.usuario.rol).toBe('estandar');
        expect(res.usuario.estado).toBe('activo');
        expect(res.usuario.limites.appsHabilitadas).toHaveLength(6);
        expect(res.usuarios).toHaveLength(3);
      }
    });

    it('falla si el nombre está vacío', () => {
      const res = crearUsuario(adminActivo, [adminActivo], {
        nombre: '   ',
        pin: '1234',
        rol: 'estandar',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.NOMBRE_VACIO);
      }
    });

    it('falla si el nombre está duplicado (sin importar mayúsculas)', () => {
      const res = crearUsuario(adminActivo, [adminActivo, usuarioEstandar], {
        nombre: 'mateo',
        pin: '1234',
        rol: 'estandar',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.NOMBRE_DUPLICADO);
      }
    });

    it('falla si el PIN no tiene exactamente 4 dígitos', () => {
      const res1 = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Sofía',
        pin: '123',
        rol: 'estandar',
      });
      expect(res1.ok).toBe(false);
      if (!res1.ok) {
        expect(res1.motivo).toBe(MOTIVOS_ERROR_USUARIOS.PIN_INVALIDO);
      }

      const res2 = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Sofía',
        pin: 'abcd',
        rol: 'estandar',
      });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.motivo).toBe(MOTIVOS_ERROR_USUARIOS.PIN_INVALIDO);
      }
    });

    it('falla si se pasan límites fuera de rango', () => {
      const res = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Sofía',
        pin: '1234',
        rol: 'estandar',
        limites: { maxTareasActivas: 9 }, // Máximo permitido es 5
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.LIMITES_INVALIDOS);
      }
    });
  });

  describe('bloquearUsuario', () => {
    it('bloquea a un usuario estándar correctamente', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.estado).toBe('bloqueado');
        const usr = res.usuarios.find((u) => u.id === usuarioEstandar.id);
        expect(usr?.estado).toBe('bloqueado');
      }
    });

    it('no permite que un administrador se bloquee a sí mismo', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, adminSecundario], adminActivo.id);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.AUTO_BLOQUEO_NO_PERMITIDO);
      }
    });

    it('no permite bloquear al último administrador activo', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, usuarioEstandar], adminActivo.id);
      // Falla primero por auto-bloqueo o por último admin
      expect(res.ok).toBe(false);

      // Si otro intenta bloquear al único admin (por ejemplo si adminSecundario fuera no admin o no existiera)
      const res2 = bloquearUsuario(
        adminSecundario,
        [adminActivo, usuarioEstandar],
        adminActivo.id
      );
      // adminSecundario no está en la lista de usuarios activos administradores
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMIN_ACTIVO);
      }
    });
  });

  describe('desbloquearUsuario', () => {
    it('desbloquea a un usuario bloqueado', () => {
      const bloqueado: Usuario = { ...usuarioEstandar, estado: 'bloqueado' };
      const res = desbloquearUsuario(adminActivo, [adminActivo, bloqueado], bloqueado.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.estado).toBe('activo');
      }
    });
  });

  describe('cambiarRol', () => {
    it('promueve a un usuario a admin', () => {
      const res = cambiarRol(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, 'admin');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.rol).toBe('admin');
      }
    });

    it('no permite degradar al último administrador activo', () => {
      const res = cambiarRol(adminActivo, [adminActivo, usuarioEstandar], adminActivo.id, 'estandar');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMIN_ACTIVO);
      }
    });

    it('permite degradar a un admin si queda otro activo', () => {
      const res = cambiarRol(
        adminActivo,
        [adminActivo, adminSecundario],
        adminSecundario.id,
        'estandar'
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.rol).toBe('estandar');
      }
    });
  });

  describe('actualizarLimites', () => {
    it('actualiza los límites dentro de rangos válidos', () => {
      const res = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 5,
        memoriaMaximaMb: 1536,
        appsHabilitadas: ['focuspad', 'burble'],
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.limites.maxTareasActivas).toBe(5);
        expect(res.usuario.limites.memoriaMaximaMb).toBe(1536);
        expect(res.usuario.limites.appsHabilitadas).toEqual(['focuspad', 'burble']);
      }
    });

    it('falla con tareas activas fuera de rango (< 1 o > 5)', () => {
      const resBajo = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 0,
      });
      expect(resBajo.ok).toBe(false);

      const resAlto = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 6,
      });
      expect(resAlto.ok).toBe(false);
    });

    it('falla con memoria fuera de rango (< 256 o > 2048)', () => {
      const resBajo = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        memoriaMaximaMb: 128,
      });
      expect(resBajo.ok).toBe(false);

      const resAlto = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        memoriaMaximaMb: 4096,
      });
      expect(resAlto.ok).toBe(false);
    });
  });
});
