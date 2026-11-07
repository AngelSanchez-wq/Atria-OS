export interface AudioPlayer {
  /** Reproduce un archivo de audio en loop o una sola vez. */
  play(src: string, loop?: boolean): Promise<void>;
  /** Detiene el audio actual y reinicia su posición. */
  stop(): void;
  /** Establece el volumen entre 0.0 y 1.0. */
  setVolume(volume: number): void;
  /** Obtiene el volumen actual entre 0.0 y 1.0. */
  getVolume(): number;
}
