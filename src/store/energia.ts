import { create } from 'zustand';
import {
  EstadoEnergia,
  puedeTransicionar,
  transicionarEnergia,
} from '../kernel/power/transiciones';
import { EstadoProceso } from '../kernel/types';

export type TipoDialogoEnergia = 'apagar' | 'reiniciar' | null;

type EnergiaStore = {
  estado: EstadoEnergia;
  estadosProcesosPrevios: Record<number, EstadoProceso>;
  dialogoConfirmacion: TipoDialogoEnergia;

  transicionar: (destino: EstadoEnergia) => boolean;
  solicitarApagar: () => void;
  solicitarReiniciar: () => void;
  cancelarDialogo: () => void;
  guardarEstadosPrevios: (estados: Record<number, EstadoProceso>) => void;
};

export const useEnergia = create<EnergiaStore>((set, get) => ({
  estado: 'encendiendo',
  estadosProcesosPrevios: {},
  dialogoConfirmacion: null,

  transicionar: (destino) => {
    const { estado } = get();
    if (!puedeTransicionar(estado, destino)) {
      return false;
    }
    set({
      estado: transicionarEnergia(estado, destino),
      dialogoConfirmacion: null,
    });
    return true;
  },

  solicitarApagar: () => set({ dialogoConfirmacion: 'apagar' }),
  solicitarReiniciar: () => set({ dialogoConfirmacion: 'reiniciar' }),
  cancelarDialogo: () => set({ dialogoConfirmacion: null }),
  guardarEstadosPrevios: (estados) => set({ estadosProcesosPrevios: estados }),
}));
