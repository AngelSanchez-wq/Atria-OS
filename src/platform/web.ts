import {
  Platform,
  TemaEfectivo,
  AudioPlayer,
  EstadoBateriaPlatform,
  EstadoRedPlatform,
  DatosRecorte,
  VistaPreviaFoto,
  ErrorImagenPlatform,
} from './types';
import {
  BATERIA_SIMULADA_NIVEL_INICIAL,
  BATERIA_SIMULADA_DESCARGA_INTERVALO_MS,
} from '../kernel/power/bateria';
import { formatearCalidadRed } from '../kernel/network/calidad';
import {
  LADO_FOTO_PX,
  CALIDAD_COMPRESION_FOTO,
  TAMANO_MAX_ENTRADA_BYTES,
} from '../kernel/users/foto';

/**
 * Revoca de forma segura una URL de objeto temporal sin lanzar errores en entornos de prueba o SSR.
 */
function liberarUrlObjeto(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Silenciar excepciones al revocar URLs de objeto en entornos simulados
  }
}

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

  /**
   * Obtiene las dimensiones naturales de una imagen y genera una URL de objeto temporal para vista previa.
   * La URL debe liberarse llamando a `liberar()` para evitar fugas de memoria.
   */
  async obtenerVistaPreviaFoto(archivo: File | Blob): Promise<VistaPreviaFoto> {
    if (!archivo || archivo.size === 0) {
      throw new ErrorImagenPlatform('archivo-invalido', 'El archivo no es válido o está vacío');
    }
    if (archivo.size > TAMANO_MAX_ENTRADA_BYTES) {
      throw new ErrorImagenPlatform('imagen-demasiado-grande', 'El archivo supera el tamaño máximo permitido (5 MB)');
    }
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new ErrorImagenPlatform('decodificacion-fallida', 'API URL no disponible');
    }

    const url = URL.createObjectURL(archivo);

    // Intentar decodificar con createImageBitmap si existe para mejor rendimiento
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(archivo);
        const ancho = bmp.width;
        const alto = bmp.height;
        bmp.close();
        if (!ancho || !alto || ancho <= 0 || alto <= 0) {
          liberarUrlObjeto(url);
          throw new ErrorImagenPlatform('decodificacion-fallida', 'Dimensiones de imagen inválidas');
        }
        if (ancho > 8192 || alto > 8192) {
          liberarUrlObjeto(url);
          throw new ErrorImagenPlatform('imagen-demasiado-grande', 'La resolución de la imagen es excesiva');
        }
        return {
          url,
          ancho,
          alto,
          liberar: () => liberarUrlObjeto(url),
        };
      } catch (err) {
        if (err instanceof ErrorImagenPlatform) {
          throw err;
        }
        // Fallback a HTMLImageElement
      }
    }

    return new Promise<VistaPreviaFoto>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ancho = img.naturalWidth || img.width;
        const alto = img.naturalHeight || img.height;
        if (!ancho || !alto || ancho <= 0 || alto <= 0) {
          liberarUrlObjeto(url);
          reject(new ErrorImagenPlatform('decodificacion-fallida', 'Dimensiones de imagen inválidas'));
          return;
        }
        if (ancho > 8192 || alto > 8192) {
          liberarUrlObjeto(url);
          reject(new ErrorImagenPlatform('imagen-demasiado-grande', 'La resolución de la imagen es excesiva'));
          return;
        }
        resolve({
          url,
          ancho,
          alto,
          liberar: () => liberarUrlObjeto(url),
        });
      };
      img.onerror = () => {
        liberarUrlObjeto(url);
        reject(new ErrorImagenPlatform('decodificacion-fallida', 'No se pudo decodificar la imagen'));
      };
      img.src = url;
    });
  }

  /**
   * Procesa, recorta y redimensiona una imagen al tamaño estándar de avatar (256x256),
   * retornando una data URL en JPEG con compresión controlada.
   */
  async procesarImagen(archivo: File | Blob, recorte: DatosRecorte): Promise<string> {
    if (!archivo || archivo.size === 0) {
      throw new ErrorImagenPlatform('archivo-invalido', 'El archivo no es válido o está vacío');
    }
    if (archivo.size > TAMANO_MAX_ENTRADA_BYTES) {
      throw new ErrorImagenPlatform('imagen-demasiado-grande', 'El archivo supera el tamaño máximo permitido (5 MB)');
    }
    if (recorte.lado <= 0 || recorte.x < 0 || recorte.y < 0) {
      throw new ErrorImagenPlatform('archivo-invalido', 'Coordenadas de recorte inválidas');
    }

    const rx = Math.round(recorte.x);
    const ry = Math.round(recorte.y);
    const rLado = Math.round(recorte.lado);

    // Intentar primero con createImageBitmap para eficiencia de memoria
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(archivo, rx, ry, rLado, rLado);
        try {
          if (typeof document === 'undefined') {
            throw new ErrorImagenPlatform('contexto-canvas-no-disponible', 'Entorno DOM no disponible');
          }
          const canvas = document.createElement('canvas');
          canvas.width = LADO_FOTO_PX;
          canvas.height = LADO_FOTO_PX;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new ErrorImagenPlatform('contexto-canvas-no-disponible', 'No se pudo obtener el contexto 2D del canvas');
          }
          ctx.drawImage(bmp, 0, 0, LADO_FOTO_PX, LADO_FOTO_PX);
          return canvas.toDataURL('image/jpeg', CALIDAD_COMPRESION_FOTO);
        } finally {
          bmp.close();
        }
      } catch (err) {
        if (err instanceof ErrorImagenPlatform) {
          throw err;
        }
        // Fallback a HTMLImageElement
      }
    }

    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new ErrorImagenPlatform('decodificacion-fallida', 'API URL no disponible');
    }

    const url = URL.createObjectURL(archivo);
    let img: HTMLImageElement;
    try {
      img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new ErrorImagenPlatform('decodificacion-fallida', 'No se pudo decodificar la imagen'));
        image.src = url;
      });
    } catch (err) {
      liberarUrlObjeto(url);
      throw err;
    }

    try {
      if (typeof document === 'undefined') {
        throw new ErrorImagenPlatform('contexto-canvas-no-disponible', 'Entorno DOM no disponible');
      }
      const canvas = document.createElement('canvas');
      canvas.width = LADO_FOTO_PX;
      canvas.height = LADO_FOTO_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new ErrorImagenPlatform('contexto-canvas-no-disponible', 'No se pudo obtener el contexto 2D del canvas');
      }
      ctx.drawImage(img, rx, ry, rLado, rLado, 0, 0, LADO_FOTO_PX, LADO_FOTO_PX);
      return canvas.toDataURL('image/jpeg', CALIDAD_COMPRESION_FOTO);
    } finally {
      liberarUrlObjeto(url);
    }
  }
}

export const platform: Platform = new WebPlatform();
