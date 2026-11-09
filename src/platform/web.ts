import {
  Platform,
  TemaEfectivo,
  AudioPlayer,
  EstadoBateriaPlatform,
  EstadoRedPlatform,
} from './types';
import {
  BATERIA_SIMULADA_NIVEL_INICIAL,
  BATERIA_SIMULADA_DESCARGA_INTERVALO_MS,
} from '../kernel/power/bateria';
import { formatearCalidadRed } from '../kernel/network/calidad';

export class WebAudioPlayer implements AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  async play(src: string, loop: boolean = true): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.audio = new Audio(src);
    this.audio.loop = loop;
    this.audio.volume = this.volume;
    await this.audio.play();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }
}

export class WebPlatform implements Platform {
  // Estado y temporizador para la batería simulada cuando el navegador no soporta Battery API
  private nivelBateriaSimulada: number = BATERIA_SIMULADA_NIVEL_INICIAL;
  private cargandoBateriaSimulada: boolean = false;
  private temporizadorBateriaSimulada: ReturnType<typeof setInterval> | null = null;
  private escuchadoresBateria: Set<(estado: EstadoBateriaPlatform) => void> = new Set();

  getSystemTheme(): TemaEfectivo {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const esOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return esOscuro ? 'oscuro' : 'claro';
      } catch {
        return 'claro';
      }
    }
    return 'claro';
  }

  saveState<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignorar fallos de almacenamiento en entornos restringidos
    }
  }

  loadState<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  applyTheme(theme: TemaEfectivo): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-theme',
        theme === 'oscuro' ? 'dark' : 'light'
      );
    }
  }

  createAudioPlayer(): AudioPlayer {
    return new WebAudioPlayer();
  }

  // ─── Batería ─────────────────────────────────────────────────────────────

  async getBatteryLevel(): Promise<number> {
    const estado = await this.getBatteryStatus();
    return estado.nivel;
  }

  async isBatteryCharging(): Promise<boolean> {
    const estado = await this.getBatteryStatus();
    return estado.cargando;
  }

  async getBatteryStatus(): Promise<EstadoBateriaPlatform> {
    if (
      typeof navigator !== 'undefined' &&
      typeof (navigator as unknown as { getBattery?: () => Promise<unknown> }).getBattery ===
        'function'
    ) {
      try {
        const batteryManager = await (
          navigator as unknown as {
            getBattery: () => Promise<{
              level: number;
              charging: boolean;
              dischargingTime: number;
              chargingTime: number;
            }>;
          }
        ).getBattery();

        if (batteryManager && typeof batteryManager.level === 'number') {
          return {
            nivel: Math.round(batteryManager.level * 100),
            cargando: Boolean(batteryManager.charging),
            tiempoDescargaSegundos: Number.isFinite(batteryManager.dischargingTime)
              ? batteryManager.dischargingTime
              : undefined,
            tiempoCargaSegundos: Number.isFinite(batteryManager.chargingTime)
              ? batteryManager.chargingTime
              : undefined,
            esSimulada: false,
          };
        }
      } catch {
        // Fallback a batería simulada
      }
    }

    // Batería simulada como respaldo
    return {
      nivel: this.nivelBateriaSimulada,
      cargando: this.cargandoBateriaSimulada,
      esSimulada: true,
    };
  }

  onBatteryChange(
    callback: (estado: EstadoBateriaPlatform) => void
  ): () => void {
    this.escuchadoresBateria.add(callback);

    const limpiadoresNavegador: (() => void)[] = [];
    let usandoApiReal = false;

    if (
      typeof navigator !== 'undefined' &&
      typeof (navigator as unknown as { getBattery?: () => Promise<unknown> }).getBattery ===
        'function'
    ) {
      (
        navigator as unknown as {
          getBattery: () => Promise<{
            level: number;
            charging: boolean;
            dischargingTime: number;
            chargingTime: number;
            addEventListener: (tipo: string, fn: () => void) => void;
            removeEventListener: (tipo: string, fn: () => void) => void;
          }>;
        }
      )
        .getBattery()
        .then((bm) => {
          if (!bm) return;
          usandoApiReal = true;

          const notificar = () => {
            callback({
              nivel: Math.round(bm.level * 100),
              cargando: Boolean(bm.charging),
              tiempoDescargaSegundos: Number.isFinite(bm.dischargingTime)
                ? bm.dischargingTime
                : undefined,
              tiempoCargaSegundos: Number.isFinite(bm.chargingTime)
                ? bm.chargingTime
                : undefined,
              esSimulada: false,
            });
          };

          const eventos = [
            'chargingchange',
            'levelchange',
            'chargingtimechange',
            'dischargingtimechange',
          ];
          for (const ev of eventos) {
            bm.addEventListener(ev, notificar);
            limpiadoresNavegador.push(() => bm.removeEventListener(ev, notificar));
          }

          // Emitir estado inicial
          notificar();
        })
        .catch(() => {
          this.iniciarSimulacionBateriaSiEsNecesario();
        });
    }

    if (!usandoApiReal) {
      this.iniciarSimulacionBateriaSiEsNecesario();
      // Emitir estado simulado inicial
      callback({
        nivel: this.nivelBateriaSimulada,
        cargando: this.cargandoBateriaSimulada,
        esSimulada: true,
      });
    }

    return () => {
      this.escuchadoresBateria.delete(callback);
      for (const limpiar of limpiadoresNavegador) {
        limpiar();
      }
      if (this.escuchadoresBateria.size === 0 && this.temporizadorBateriaSimulada) {
        clearInterval(this.temporizadorBateriaSimulada);
        this.temporizadorBateriaSimulada = null;
      }
    };
  }

  private iniciarSimulacionBateriaSiEsNecesario(): void {
    if (this.temporizadorBateriaSimulada !== null) return;

    this.temporizadorBateriaSimulada = setInterval(() => {
      if (!this.cargandoBateriaSimulada && this.nivelBateriaSimulada > 1) {
        this.nivelBateriaSimulada -= 1;
        const estado: EstadoBateriaPlatform = {
          nivel: this.nivelBateriaSimulada,
          cargando: false,
          esSimulada: true,
        };
        for (const cb of this.escuchadoresBateria) {
          cb(estado);
        }
      }
    }, BATERIA_SIMULADA_DESCARGA_INTERVALO_MS);
  }

  // ─── Red ─────────────────────────────────────────────────────────────────

  getNetworkStatus(): EstadoRedPlatform {
    const enLinea =
      typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;

    let calidad: string | undefined = undefined;

    if (typeof navigator !== 'undefined') {
      const conn =
        (navigator as unknown as { connection?: unknown }).connection ||
        (navigator as unknown as { mozConnection?: unknown }).mozConnection ||
        (navigator as unknown as { webkitConnection?: unknown }).webkitConnection;

      if (conn && typeof conn === 'object') {
        const c = conn as {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
        calidad = formatearCalidadRed({
          effectiveType: c.effectiveType,
          downlink: c.downlink,
          rtt: c.rtt,
        });
      }
    }

    return { enLinea, calidad };
  }

  onNetworkChange(callback: (estado: EstadoRedPlatform) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const notificar = () => {
      callback(this.getNetworkStatus());
    };

    window.addEventListener('online', notificar);
    window.addEventListener('offline', notificar);

    type ConexionConEventos = {
      addEventListener?: (tipo: string, fn: () => void) => void;
      removeEventListener?: (tipo: string, fn: () => void) => void;
    };

    let connRef: ConexionConEventos | null = null;

    if (typeof navigator !== 'undefined') {
      const conn =
        (navigator as unknown as { connection?: unknown }).connection ||
        (navigator as unknown as { mozConnection?: unknown }).mozConnection ||
        (navigator as unknown as { webkitConnection?: unknown }).webkitConnection;

      if (conn && typeof conn === 'object' && 'addEventListener' in conn) {
        connRef = conn as ConexionConEventos;
        connRef.addEventListener?.('change', notificar);
      }
    }

    return () => {
      window.removeEventListener('online', notificar);
      window.removeEventListener('offline', notificar);
      if (connRef?.removeEventListener) {
        connRef.removeEventListener('change', notificar);
      }
    };
  }
}

export const platform: Platform = new WebPlatform();
