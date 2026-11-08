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
      const res = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Valery Gómez',
        pin: '9876',
        rol: 'estandar',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.nombre).toBe('Valery Gómez');
        expect(res.usuario.pin).toBe('9876');
        expect(res.usuario.estado).toBe('activo');
        expect(res.usuario.limites).toEqual(LIMITES_USUARIO_POR_DEFECTO);
        expect(res.usuarios).toHaveLength(2);
      }
    });

    it('rechaza nombres vacíos o solo con espacios', () => {
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

    it('rechaza nombres duplicados ignorando mayúsculas y espacios', () => {
      const res = crearUsuario(adminActivo, [adminActivo, usuarioEstandar], {
        nombre: '  mateo  ',
        pin: '9999',
        rol: 'estandar',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.NOMBRE_DUPLICADO);
      }
    });

    it('rechaza PIN con longitud distinta de 4 dígitos o caracteres no numéricos', () => {
      const resCorto = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Lucas',
        pin: '123',
        rol: 'estandar',
      });
      expect(resCorto.ok).toBe(false);
      if (!resCorto.ok) {
        expect(resCorto.motivo).toBe(MOTIVOS_ERROR_USUARIOS.PIN_INVALIDO);
      }

      const resLetras = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Lucas',
        pin: 'abcd',
        rol: 'estandar',
      });
      expect(resLetras.ok).toBe(false);
    });

    it('rechaza creación si los límites especificados están fuera de rango', () => {
      const res = crearUsuario(adminActivo, [adminActivo], {
        nombre: 'Lucas',
        pin: '1234',
        rol: 'estandar',
        limites: { maxTareasActivas: 9 },
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.LIMITES_FUERA_DE_RANGO);
      }
    });
  });

  describe('bloquearUsuario', () => {
    it('impide que un administrador se bloquee a sí mismo', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, adminSecundario], adminActivo.id);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.AUTO_BLOQUEO_NO_PERMITIDO);
      }
    });

    it('impide bloquear al último administrador activo del sistema', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, usuarioEstandar], adminActivo.id);
      expect(res.ok).toBe(false);

      // Si otro actor admin intentara bloquear al único admin activo:
      const resUltimo = bloquearUsuario(adminSecundario, [adminActivo, usuarioEstandar], adminActivo.id);
      expect(resUltimo.ok).toBe(false);
      if (!resUltimo.ok) {
        expect(resUltimo.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMINISTRADOR);
      }
    });

    it('permite bloquear a un administrador si existen otros administradores activos', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, adminSecundario], adminSecundario.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.estado).toBe('bloqueado');
      }
    });

    it('bloquea a un usuario estándar con éxito', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.estado).toBe('bloqueado');
      }
    });

    it('falla con usuario no encontrado si el ID no existe', () => {
      const res = bloquearUsuario(adminActivo, [adminActivo], 'fantasma');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.USUARIO_NO_ENCONTRADO);
      }
    });
  });

  describe('desbloquearUsuario', () => {
    it('desbloquea a un usuario previamente bloqueado', () => {
      const bloqueado: Usuario = { ...usuarioEstandar, estado: 'bloqueado' };
      const res = desbloquearUsuario(adminActivo, [adminActivo, bloqueado], bloqueado.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.estado).toBe('activo');
      }
    });
  });

  describe('cambiarRol', () => {
    it('impide degradar al último administrador activo', () => {
      const res = cambiarRol(adminActivo, [adminActivo, usuarioEstandar], adminActivo.id, 'estandar');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMINISTRADOR);
      }
    });

    it('permite degradar a un admin si queda otro activo', () => {
      const res = cambiarRol(adminActivo, [adminActivo, adminSecundario], adminSecundario.id, 'estandar');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.rol).toBe('estandar');
      }
    });

    it('permite promover a un usuario estándar a administrador', () => {
      const res = cambiarRol(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, 'admin');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.rol).toBe('admin');
      }
    });
  });

  describe('actualizarLimites', () => {
    it('actualiza los límites dentro de los rangos válidos', () => {
      const res = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 4,
        memoriaMaximaMb: 512,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.usuario.limites.maxTareasActivas).toBe(4);
        expect(res.usuario.limites.memoriaMaximaMb).toBe(512);
      }
    });

    it('rechaza tareas fuera del rango permitido (1 a 5)', () => {
      const resBajo = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 0,
      });
      expect(resBajo.ok).toBe(false);

      const resAlto = actualizarLimites(adminActivo, [adminActivo, usuarioEstandar], usuarioEstandar.id, {
        maxTareasActivas: 6,
      });
      expect(resAlto.ok).toBe(false);
    });

    it('rechaza memoria fuera del rango permitido (256 a 2048 MB)', () => {
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
