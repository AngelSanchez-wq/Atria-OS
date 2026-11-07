import { Platform, TemaEfectivo, AudioPlayer } from './types';

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
}

export const platform: Platform = new WebPlatform();
