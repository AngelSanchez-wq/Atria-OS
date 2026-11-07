import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioStore, VOLUMEN_INICIAL } from './audio';

describe('useAudioStore', () => {
  beforeEach(() => {
    useAudioStore.setState({
      sonidoActivo: null,
      volumen: VOLUMEN_INICIAL,
      silenciado: false,
      aviso: null,
    });
  });

  it('tiene los valores iniciales correctos', () => {
    const { sonidoActivo, volumen, silenciado, aviso } = useAudioStore.getState();
    expect(sonidoActivo).toBeNull();
    expect(volumen).toBe(0.5);
    expect(silenciado).toBe(false);
    expect(aviso).toBeNull();
  });

  it('permite cambiar sonido activo, volumen y aviso', () => {
    useAudioStore.getState().setSonidoActivo('lluvia');
    expect(useAudioStore.getState().sonidoActivo).toBe('lluvia');

    useAudioStore.getState().setVolumen(0.8);
    expect(useAudioStore.getState().volumen).toBe(0.8);

    useAudioStore.getState().setAviso('Pulsa un sonido para empezar');
    expect(useAudioStore.getState().aviso).toBe('Pulsa un sonido para empezar');
  });
});
