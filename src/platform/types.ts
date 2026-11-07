import { AudioPlayer } from './audio';

export type PreferenciaTema = 'claro' | 'oscuro' | 'auto';
export type TemaEfectivo = 'claro' | 'oscuro';

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
}

export type { AudioPlayer };
