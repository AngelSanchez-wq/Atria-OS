import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebPlatform } from './web';

describe('WebPlatform', () => {
  let p: WebPlatform;

  beforeEach(() => {
    localStorage.clear();
    p = new WebPlatform();
  });

  it('guarda y recupera valores de estado serializados', () => {
    p.saveState('test_key', { foo: 'bar', num: 42 });
    const recovered = p.loadState('test_key', { foo: '', num: 0 });
    expect(recovered).toEqual({ foo: 'bar', num: 42 });
  });

  it('devuelve el valor por defecto si la clave no existe', () => {
    const val = p.loadState('no_existe', 'defecto');
    expect(val).toBe('defecto');
  });

  it('aplica el tema en el elemento html', () => {
    p.applyTheme('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    p.applyTheme('claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('crea un reproductor de audio funcional con loop y volumen', async () => {
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    const mockPause = vi.fn();
    const mockConstructor = vi.fn();

    class MockAudio {
      src: string;
      play = mockPlay;
      pause = mockPause;
      loop = false;
      volume = 1;
      currentTime = 0;

      constructor(src: string) {
        this.src = src;
        mockConstructor(src);
      }
    }

    vi.stubGlobal('Audio', MockAudio);

    try {
      const player = p.createAudioPlayer();
      player.setVolume(0.8);
      expect(player.getVolume()).toBe(0.8);

      await player.play('sounds/lluvia.mp3');
      expect(mockConstructor).toHaveBeenCalledWith('sounds/lluvia.mp3');
      expect(mockPlay).toHaveBeenCalled();

      player.stop();
      expect(mockPause).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

