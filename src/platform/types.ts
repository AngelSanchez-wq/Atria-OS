import { AudioPlayer } from './audio';

export type PreferenciaTema = 'claro' | 'oscuro' | 'auto';
export type TemaEfectivo = 'claro' | 'oscuro';

export type EstadoBateriaPlatform = {
  nivel: number; // 0 a 100
  cargando: boolean;
  tiempoDescargaSegundos?: number;
  tiempoCargaSegundos?: number;
  esSimulada: boolean;
};

export type EstadoRedPlatform = {
  enLinea: boolean;
  calidad?: string;
};

export type DatosRecorte = {
  x: number;
  y: number;
  lado: number;
};

export type VistaPreviaFoto = {
  url: string;
  ancho: number;
  alto: number;
  liberar: () => void;
};

export type ErrorProcesamientoImagen =
  | 'archivo-invalido'
  | 'decodificacion-fallida'
  | 'imagen-demasiado-grande'
  | 'contexto-canvas-no-disponible';

export class ErrorImagenPlatform extends Error {
  constructor(public readonly motivo: ErrorProcesamientoImagen, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorImagenPlatform';
  }
}

export interface Platform {
  /** Obtiene la preferencia de tema del sistema operativo subyacente. */
  getSystemTheme(): TemaEfectivo;
  /** Guarda un valor serializado en el almacenamiento persistente. */
  saveState<T>(key: string, value: T): void;
  /** Carga un valor serializado del almacenamiento persistente con valor por defecto. */
  loadState<T>(key: string, defaultValue: T): T;
  /** Aplica el tema efectivo en el documento. */
  applyTheme(theme: TemaEfectivo): void;
  /** Crea un reproductor de audio aislado. */
  createAudioPlayer(): AudioPlayer;

  /** Obtiene el nivel de batería (0 a 100). */
  getBatteryLevel(): Promise<number>;
  /** Obtiene si la batería está actualmente cargando. */
  isBatteryCharging(): Promise<boolean>;
  /** Obtiene el estado completo de batería del sistema o respaldo simulado. */
  getBatteryStatus(): Promise<EstadoBateriaPlatform>;
  /** Suscribe a cambios en el estado de batería. Retorna función de desuscripción. */
  onBatteryChange(callback: (estado: EstadoBateriaPlatform) => void): () => void;

  /** Obtiene el estado real de conexión a la red del equipo. */
  getNetworkStatus(): EstadoRedPlatform;
  /** Suscribe a cambios de conectividad (online/offline) y calidad de red. */
  onNetworkChange(callback: (estado: EstadoRedPlatform) => void): () => void;

  /**
   * Obtiene las dimensiones naturales de una imagen y genera una URL de objeto temporal para vista previa.
   * La URL debe liberarse llamando a `liberar()` para prevenir fugas de memoria.
   */
  obtenerVistaPreviaFoto(archivo: File | Blob): Promise<VistaPreviaFoto>;

  /**
   * Procesa, recorta y redimensiona una imagen al tamaño estándar de avatar (256x256),
   * retornando una data URL en JPEG con compresión controlada.
   */
  procesarImagen(archivo: File | Blob, recorte: DatosRecorte): Promise<string>;
}

export type { AudioPlayer };
