import { create } from 'zustand';
import {
  VOLUMEN_MAESTRO_INICIAL,
  SILENCIADO_INICIAL,
  CLAVE_PERSISTENCIA_VOLUMEN,
  CLAVE_PERSISTENCIA_SILENCIO,
} from '../config/volumen';
import { platform } from '../platform/web';

export type VolumenStore = {
  volumen: number;
  silenciado: boolean;
  setVolumen: (volumen: number) => void;
  setSilenciado: (silenciado: boolean) => void;
  alternarSilencio: () => void;
  reiniciar: () => void;
};

// Carga inicial persistida desde la plataforma
const volumenInicial = platform.loadState<number>(
  CLAVE_PERSISTENCIA_VOLUMEN,
  VOLUMEN_MAESTRO_INICIAL
);

const silenciadoInicial = platform.loadState<boolean>(
  CLAVE_PERSISTENCIA_SILENCIO,
  SILENCIADO_INICIAL
);

// TODO: Guardar preferencias de volumen por usuario al persistir sesión
export const useVolumenStore = create<VolumenStore>((set) => ({
  volumen: Math.max(0, Math.min(1, volumenInicial)),
  silenciado: silenciadoInicial,

  setVolumen: (nuevoVolumen) => {
    const vol = Math.max(0, Math.min(1, nuevoVolumen));
    platform.saveState(CLAVE_PERSISTENCIA_VOLUMEN, vol);
    set({ volumen: vol });
  },

  setSilenciado: (silenciado) => {
    platform.saveState(CLAVE_PERSISTENCIA_SILENCIO, silenciado);
    set({ silenciado });
  },

  alternarSilencio: () => {
    set((state) => {
      const nuevoSilenciado = !state.silenciado;
      platform.saveState(CLAVE_PERSISTENCIA_SILENCIO, nuevoSilenciado);
      return { silenciado: nuevoSilenciado };
    });
  },

  reiniciar: () => {
    platform.saveState(CLAVE_PERSISTENCIA_VOLUMEN, VOLUMEN_MAESTRO_INICIAL);
    platform.saveState(CLAVE_PERSISTENCIA_SILENCIO, SILENCIADO_INICIAL);
    set({
      volumen: VOLUMEN_MAESTRO_INICIAL,
      silenciado: SILENCIADO_INICIAL,
    });
  },
}));
