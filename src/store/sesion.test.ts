import { describe, it, expect, beforeEach } from 'vitest';
import { useSesion } from './sesion';
import { USUARIOS_SEMILLA } from '../kernel/users/usuarios-semilla';

describe('Store Sesion', () => {
  beforeEach(() => {
    useSesion.setState({ usuario: null, estadosProcesosPorUsuario: {} });
  });

  it('permite ingresar, salir y guardar estados por usuario', () => {
    const usuario = USUARIOS_SEMILLA[1];

    useSesion.getState().ingresar(usuario);
    expect(useSesion.getState().usuario).toEqual(usuario);

    useSesion.getState().guardarEstadosUsuario('mateo', { 2: 'En ejecución' });
    expect(useSesion.getState().estadosProcesosPorUsuario['mateo']).toEqual({
      2: 'En ejecución',
    });

    useSesion.getState().limpiarUsuario('mateo');
    expect(useSesion.getState().estadosProcesosPorUsuario['mateo']).toBeUndefined();
    expect(useSesion.getState().usuario).toBeNull();
  });
});
