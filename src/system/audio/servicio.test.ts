import { describe, it, expect, beforeEach, vi } from 'vitest';
import { servicioAudio } from './servicio';
import { useAudioStore } from '../../store/audio';
import { platform } from '../../platform/web';
import { AudioPlayer } from '../../platform/types';

describe('ServicioAudio', () => {
  const mockPlay = vi.fn<(src: string, loop?: boolean) => Promise<void>>();
  const mockStop = vi.fn<() => void>();
  const mockSetVolume = vi.fn<(volume: number) => void>();

  beforeEach(() => {
    useAudioStore.setState({
      sonidoActivo: null,
      volumen: 0.5,
      silenciado: false,
      aviso: null,
    });

    mockPlay.mockReset().mockResolvedValue(undefined);
    mockStop.mockReset();
    mockSetVolume.mockReset();

    const mockPlayer: AudioPlayer = {
      play: mockPlay,
      stop: mockStop,
      setVolume: mockSetVolume,
      getVolume: () => 0.5,
    };

    vi.spyOn(platform, 'createAudioPlayer').mockReturnValue(mockPlayer);
    (servicioAudio as unknown as { player: AudioPlayer }).player = mockPlayer;
  });

  it('reproduce con loop activado y actualiza el store', async () => {
    await servicioAudio.reproducir('lluvia');

    expect(useAudioStore.getState().sonidoActivo).toBe('lluvia');
    expect(useAudioStore.getState().aviso).toBeNull();
  });

  it('detiene la reproducción y limpia el store', async () => {
    await servicioAudio.reproducir('bosque');
    expect(useAudioStore.getState().sonidoActivo).toBe('bosque');

    servicioAudio.detener();
    expect(useAudioStore.getState().sonidoActivo).toBeNull();
  });

  it('establece el volumen limitándolo entre 0 y 1', () => {
    servicioAudio.establecerVolumen(0.7);
    expect(useAudioStore.getState().volumen).toBe(0.7);

    servicioAudio.establecerVolumen(1.5);
    expect(useAudioStore.getState().volumen).toBe(1);

    servicioAudio.establecerVolumen(-0.2);
    expect(useAudioStore.getState().volumen).toBe(0);
  });

  it('maneja el bloqueo del navegador mostrando aviso tranquilo', async () => {
    // Forzar fallo de reproducción en el player
    const playerError: AudioPlayer = {
      play: vi.fn<(src: string, loop?: boolean) => Promise<void>>().mockRejectedValue(new Error('Autoplay blocked')),
      stop: vi.fn(),
      setVolume: vi.fn(),
      getVolume: () => 0.5,
    };
    (servicioAudio as unknown as { player: AudioPlayer }).player = playerError;

    await servicioAudio.reproducir('noche');

    expect(useAudioStore.getState().sonidoActivo).toBeNull();
    expect(useAudioStore.getState().aviso).toBe('Pulsa un sonido para empezar');
  });
});
