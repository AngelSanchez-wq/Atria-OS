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
}

export type { AudioPlayer };
