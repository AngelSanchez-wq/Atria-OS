import { describe, it, expect, beforeEach } from 'vitest';
import { useEnergia } from './energia';

describe('Store Energia', () => {
  beforeEach(() => {
    useEnergia.setState({
      estado: 'encendiendo',
      estadosProcesosPrevios: {},
      dialogoConfirmacion: null,
    });
  });

  it('permite transiciones válidas y rechaza inválidas', () => {
    expect(useEnergia.getState().transicionar('login')).toBe(true);
    expect(useEnergia.getState().estado).toBe('login');

    expect(useEnergia.getState().transicionar('activo')).toBe(true);
    expect(useEnergia.getState().estado).toBe('activo');

    // Transición inválida desde activo a encendiendo
    expect(useEnergia.getState().transicionar('encendiendo')).toBe(false);
    expect(useEnergia.getState().estado).toBe('activo');
  });

  it('controla la apertura y cancelación de diálogos de confirmación', () => {
    useEnergia.getState().solicitarApagar();
    expect(useEnergia.getState().dialogoConfirmacion).toBe('apagar');

    useEnergia.getState().cancelarDialogo();
    expect(useEnergia.getState().dialogoConfirmacion).toBeNull();

    useEnergia.getState().solicitarReiniciar();
    expect(useEnergia.getState().dialogoConfirmacion).toBe('reiniciar');
  });
});
