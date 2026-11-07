import { create } from 'zustand';
import { SonidoId } from '../apps/ambient/sonidos';

export const VOLUMEN_INICIAL = 0.5;

export type AudioState = {
  sonidoActivo: SonidoId | null;
  volumen: number;
  silenciado: boolean;
  aviso: string | null;
  setSonidoActivo: (id: SonidoId | null) => void;
  setVolumen: (volumen: number) => void;
  setSilenciado: (silenciado: boolean) => void;
  setAviso: (aviso: string | null) => void;
};

// TODO: La barra del sistema podrá usar este store en el futuro para su botón de volumen
export const useAudioStore = create<AudioState>((set) => ({
  sonidoActivo: null,
  volumen: VOLUMEN_INICIAL,
  silenciado: false,
  aviso: null,
  setSonidoActivo: (sonidoActivo) => set({ sonidoActivo }),
  setVolumen: (volumen) => set({ volumen }),
  setSilenciado: (silenciado) => set({ silenciado }),
  setAviso: (aviso) => set({ aviso }),
}));
