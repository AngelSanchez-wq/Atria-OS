import { describe, it, expect, beforeEach } from 'vitest';
import { useSesion } from './sesion';

describe('Store Sesion', () => {
  beforeEach(() => {
    useSesion.setState({ usuario: null, estadosProcesosPorUsuario: {} });
  });

  it('permite ingresar, salir y guardar estados por usuario', () => {
    const usuario = {
      id: 'mateo',
      nombre: 'Mateo',
      inicial: 'M',
      rol: 'estandar' as const,
      pin: '5678',
    };

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
