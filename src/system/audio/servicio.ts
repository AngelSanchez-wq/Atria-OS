import { platform } from '../../platform/web';
import { AudioPlayer } from '../../platform/types';
import { SonidoId, SONIDOS_AMBIENT } from '../../apps/ambient/sonidos';
import { useAudioStore } from '../../store/audio';
import { useVolumenStore } from '../../store/volumen';
import { calcularVolumenEfectivo } from './volumen';

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
  establecerVolumenMaestro(volumen: number): void;
  establecerSilenciado(silenciado: boolean): void;
  actualizarVolumenEfectivo(): void;
  obtenerVolumenEfectivo(): number;
  obtenerEstado(): {
    sonidoActivo: SonidoId | null;
    volumen: number;
    volumenMaestro: number;
    silenciado: boolean;
    volumenEfectivo: number;
    aviso: string | null;
  };
}

class ServicioAudioSistema implements ServicioAudio {
  private player: AudioPlayer;

  constructor(player?: AudioPlayer) {
    this.player = player ?? platform.createAudioPlayer();
    this.actualizarVolumenEfectivo();

    // Reaccionar automáticamente a los cambios de volumen maestro o silencio
    useVolumenStore.subscribe(() => {
      this.actualizarVolumenEfectivo();
    });

    // Reaccionar automáticamente a los cambios del volumen propio de Ambient
    useAudioStore.subscribe(() => {
      this.actualizarVolumenEfectivo();
    });
  }

  private calcularVolumenActual(): number {
    const propio = useAudioStore.getState().volumen;
    const maestro = useVolumenStore.getState().volumen;
    const silenciado = useVolumenStore.getState().silenciado;
    return calcularVolumenEfectivo(propio, maestro, silenciado);
  }

  actualizarVolumenEfectivo(): void {
    const efectivo = this.calcularVolumenActual();
    this.player.setVolume(efectivo);
  }

  obtenerVolumenEfectivo(): number {
    return this.calcularVolumenActual();
  }

  async reproducir(id: SonidoId): Promise<void> {
    const info = SONIDOS_AMBIENT.find((s) => s.id === id);
    if (!info) return;

    const ruta = obtenerRutaAudio(info.archivo);

    // TODO: Implementar fundido de entrada (fade-in) respetando prefers-reduced-motion
    try {
      useAudioStore.getState().setAviso(null);
      this.actualizarVolumenEfectivo();
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
    useAudioStore.getState().setVolumen(vol);
    this.actualizarVolumenEfectivo();
  }

  establecerVolumenMaestro(volumen: number): void {
    useVolumenStore.getState().setVolumen(volumen);
    this.actualizarVolumenEfectivo();
  }

  establecerSilenciado(silenciado: boolean): void {
    useVolumenStore.getState().setSilenciado(silenciado);
    this.actualizarVolumenEfectivo();
  }

  obtenerEstado() {
    const { sonidoActivo, volumen, aviso } = useAudioStore.getState();
    const { volumen: volumenMaestro, silenciado } = useVolumenStore.getState();
    const volumenEfectivo = this.calcularVolumenActual();
    return {
      sonidoActivo,
      volumen,
      volumenMaestro,
      silenciado,
      volumenEfectivo,
      aviso,
    };
  }

  // TODO: Pausar el audio al suspender el sistema o cambiar de usuario
}

export const servicioAudio: ServicioAudio = new ServicioAudioSistema();
