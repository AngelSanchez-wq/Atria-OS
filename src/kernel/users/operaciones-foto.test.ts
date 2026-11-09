import { describe, it, expect } from 'vitest';
import { Usuario } from '../types';
import { cambiarFoto, quitarFoto } from './operaciones';
import { LIMITES_USUARIO_POR_DEFECTO, MOTIVOS_ERROR_USUARIOS } from './constantes';

const fotoValidaJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
const fotoValidaPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const usuario1: Usuario = {
  id: 'usr-1',
  nombre: 'Mateo',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

const usuario2: Usuario = {
  id: 'usr-2',
  nombre: 'Laura',
  inicial: 'L',
  rol: 'estandar',
  pin: '5678',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
  foto: fotoValidaPng,
};

const admin: Usuario = {
  id: 'admin-1',
  nombre: 'Admin',
  inicial: 'A',
  rol: 'admin',
  pin: '0000',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

const usuarioBloqueado: Usuario = {
  id: 'usr-bloqueado',
  nombre: 'Bloqueado',
  inicial: 'B',
  rol: 'estandar',
  pin: '9999',
  estado: 'bloqueado',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
  foto: fotoValidaPng,
};

const listaUsuarios = [usuario1, usuario2, admin, usuarioBloqueado];

describe('cambiarFoto', () => {
  it('permite que un usuario cambie su propia foto', () => {
    const res = cambiarFoto(usuario1, listaUsuarios, 'usr-1', fotoValidaJpeg);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.usuario.foto).toBe(fotoValidaJpeg);
      const enLista = res.usuarios.find((u) => u.id === 'usr-1');
      expect(enLista?.foto).toBe(fotoValidaJpeg);
    }
  });

  it('permite invocar con 3 argumentos (actor, usuarioId, dataUrl)', () => {
    const res = cambiarFoto(usuario1, 'usr-1', fotoValidaJpeg);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.usuario.foto).toBe(fotoValidaJpeg);
    }
  });

  it('impide que un administrador cambie la foto de otro usuario', () => {
    const res = cambiarFoto(admin, listaUsuarios, 'usr-1', fotoValidaJpeg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.CAMBIO_FOTO_AJENA_NO_PERMITIDO);
    }
  });

  it('impide que un usuario estándar cambie la foto de otro', () => {
    const res = cambiarFoto(usuario1, listaUsuarios, 'usr-2', fotoValidaJpeg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.CAMBIO_FOTO_AJENA_NO_PERMITIDO);
    }
  });

  it('impide que una cuenta bloqueada cambie su foto', () => {
    const res = cambiarFoto(usuarioBloqueado, listaUsuarios, 'usr-bloqueado', fotoValidaJpeg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.CUENTA_BLOQUEADA);
    }
  });

  it('falla si la foto no es un data URL válido', () => {
    const res = cambiarFoto(usuario1, listaUsuarios, 'usr-1', 'data:image/svg+xml;base64,PHN2Zz4=');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.FOTO_INVALIDA);
    }
  });

  it('falla si el usuario objetivo no existe', () => {
    const fantasma: Usuario = { ...usuario1, id: 'no-existe' };
    const res = cambiarFoto(fantasma, listaUsuarios, 'no-existe', fotoValidaJpeg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE);
    }
  });
});

describe('quitarFoto', () => {
  it('permite que el propio usuario quite su foto', () => {
    const res = quitarFoto(usuario2, listaUsuarios, 'usr-2');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.usuario.foto).toBeUndefined();
      const enLista = res.usuarios.find((u) => u.id === 'usr-2');
      expect(enLista?.foto).toBeUndefined();
    }
  });

  it('permite invocar con 2 argumentos (actor, usuarioId)', () => {
    const res = quitarFoto(usuario2, 'usr-2');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.usuario.foto).toBeUndefined();
    }
  });

  it('permite que un administrador quite la foto de otro usuario', () => {
    const res = quitarFoto(admin, listaUsuarios, 'usr-2');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.usuario.foto).toBeUndefined();
      const enLista = res.usuarios.find((u) => u.id === 'usr-2');
      expect(enLista?.foto).toBeUndefined();
    }
  });

  it('impide que un usuario estándar quite la foto de otro', () => {
    const res = quitarFoto(usuario1, listaUsuarios, 'usr-2');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.ACCION_NO_PERMITIDA);
    }
  });

  it('impide que una cuenta bloqueada quite su foto', () => {
    const res = quitarFoto(usuarioBloqueado, listaUsuarios, 'usr-bloqueado');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.CUENTA_BLOQUEADA);
    }
  });

  it('impide quitar la foto a un usuario bloqueado', () => {
    const res = quitarFoto(admin, listaUsuarios, 'usr-bloqueado');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.CUENTA_BLOQUEADA);
    }
  });

  it('falla si el usuario objetivo no existe', () => {
    const res = quitarFoto(admin, listaUsuarios, 'no-existe');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.motivo).toBe(MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE);
    }
  });
});
