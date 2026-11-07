import { platform } from '../../platform/web';
import { AudioPlayer } from '../../platform/types';
import { SonidoId, SONIDOS_AMBIENT } from '../../apps/ambient/sonidos';
import { useAudioStore } from '../../store/audio';

export function obtenerRutaAudio(archivoRelativo: string): string {
  let base = import.meta.env.BASE_URL || '';
  if (base.startsWith('/')) {
    base = base.slice(1);
  }
  if (base && !base.endsWith('/')) {
    base = `${base}/`;
  }
  const archivoLimpio = archivoRelativo.startsWith('/')
    ? archivoRelativo.slice(1)
    : archivoRelativo;
  return `${base}${archivoLimpio}`;
}

export interface ServicioAudio {
  reproducir(id: SonidoId): Promise<void>;
  detener(): void;
  establecerVolumen(volumen: number): void;
  obtenerEstado(): {
    sonidoActivo: SonidoId | null;
    volumen: number;
    silenciado: boolean;
    aviso: string | null;
  };
}

class ServicioAudioSistema implements ServicioAudio {
  private player: AudioPlayer;

  constructor(player?: AudioPlayer) {
    this.player = player ?? platform.createAudioPlayer();
    this.player.setVolume(useAudioStore.getState().volumen);
  }

  async reproducir(id: SonidoId): Promise<void> {
    const info = SONIDOS_AMBIENT.find((s) => s.id === id);
    if (!info) return;

    const ruta = obtenerRutaAudio(info.archivo);

    // TODO: Implementar fundido de entrada (fade-in) respetando prefers-reduced-motion
    try {
      useAudioStore.getState().setAviso(null);
      this.player.setVolume(useAudioStore.getState().volumen);
      await this.player.play(ruta, true);
      useAudioStore.getState().setSonidoActivo(id);
    } catch {
      useAudioStore.getState().setAviso('Pulsa un sonido para empezar');
      useAudioStore.getState().setSonidoActivo(null);
    }
  }

  detener(): void {
    this.player.stop();
    useAudioStore.getState().setSonidoActivo(null);
  }

  establecerVolumen(volumen: number): void {
    const vol = Math.max(0, Math.min(1, volumen));
    this.player.setVolume(vol);
    useAudioStore.getState().setVolumen(vol);
  }

  obtenerEstado() {
    const { sonidoActivo, volumen, silenciado, aviso } = useAudioStore.getState();
    return { sonidoActivo, volumen, silenciado, aviso };
  }

  // TODO: Pausar el audio al suspender el sistema o cambiar de usuario
}

export const servicioAudio: ServicioAudio = new ServicioAudioSistema();
