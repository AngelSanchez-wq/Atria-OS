import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVolumenStore } from './volumen';
import { platform } from '../platform/web';
import {
  VOLUMEN_MAESTRO_INICIAL,
  CLAVE_PERSISTENCIA_VOLUMEN,
  CLAVE_PERSISTENCIA_SILENCIO,
} from '../config/volumen';

describe('useVolumenStore', () => {
  beforeEach(() => {
    useVolumenStore.getState().reiniciar();
    vi.restoreAllMocks();
  });

  it('inicia con el volumen maestro inicial y sin silenciar', () => {
    const estado = useVolumenStore.getState();
    expect(estado.volumen).toBe(VOLUMEN_MAESTRO_INICIAL);
    expect(estado.silenciado).toBe(false);
  });

  it('setVolumen actualiza el volumen acotándolo a [0, 1] y persiste el valor', () => {
    const spySave = vi.spyOn(platform, 'saveState');

    useVolumenStore.getState().setVolumen(0.85);
    expect(useVolumenStore.getState().volumen).toBe(0.85);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_VOLUMEN, 0.85);

    // Valores fuera de límites
    useVolumenStore.getState().setVolumen(1.5);
    expect(useVolumenStore.getState().volumen).toBe(1);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_VOLUMEN, 1);

    useVolumenStore.getState().setVolumen(-0.2);
    expect(useVolumenStore.getState().volumen).toBe(0);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_VOLUMEN, 0);
  });

  it('setSilenciado actualiza el estado de silencio y lo persiste', () => {
    const spySave = vi.spyOn(platform, 'saveState');

    useVolumenStore.getState().setSilenciado(true);
    expect(useVolumenStore.getState().silenciado).toBe(true);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_SILENCIO, true);

    useVolumenStore.getState().setSilenciado(false);
    expect(useVolumenStore.getState().silenciado).toBe(false);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_SILENCIO, false);
  });

  it('alternarSilencio invierte el estado actual y lo persiste', () => {
    const spySave = vi.spyOn(platform, 'saveState');

    useVolumenStore.getState().alternarSilencio();
    expect(useVolumenStore.getState().silenciado).toBe(true);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_SILENCIO, true);

    useVolumenStore.getState().alternarSilencio();
    expect(useVolumenStore.getState().silenciado).toBe(false);
    expect(spySave).toHaveBeenCalledWith(CLAVE_PERSISTENCIA_SILENCIO, false);
  });
});
