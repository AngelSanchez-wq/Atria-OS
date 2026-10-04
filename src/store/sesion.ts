import { create } from 'zustand';
import type { Usuario } from '../kernel/types';

type SesionEstado = {
  usuario: Usuario | null;
  ingresar: (usuario: Usuario) => void;
  salir: () => void;
};

/** Quién está dentro del sistema; se comparte entre pantallas. */
export const useSesion = create<SesionEstado>((set) => ({
  usuario: null,
  ingresar: (usuario) => set({ usuario }),
  salir: () => set({ usuario: null }),
}));
