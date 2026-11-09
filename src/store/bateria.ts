import { create } from 'zustand';
import {
  EstadoBateria,
  determinarEstadoBateria,
  calcularTiempoRestante,
  BATERIA_SIMULADA_NIVEL_INICIAL,
} from '../kernel/power/bateria';

export type EstadoBateriaStore = {
  nivel: number;
  cargando: boolean;
  estado: EstadoBateria;
  tiempoRestante: string | null;
  esSimulada: boolean;

  actualizarBateria: (datos: {
    nivel: number;
    cargando: boolean;
    tiempoDescargaSegundos?: number;
    tiempoCargaSegundos?: number;
    esSimulada: boolean;
  }) => void;
  restablecer: () => void;
};

const estadoInicial = {
  nivel: BATERIA_SIMULADA_NIVEL_INICIAL,
  cargando: false,
  estado: determinarEstadoBateria(BATERIA_SIMULADA_NIVEL_INICIAL, false),
  tiempoRestante: calcularTiempoRestante(BATERIA_SIMULADA_NIVEL_INICIAL, false),
  esSimulada: true,
};

export const useBateriaStore = create<EstadoBateriaStore>((set) => ({
  ...estadoInicial,

  actualizarBateria: ({
    nivel,
    cargando,
    tiempoDescargaSegundos,
    tiempoCargaSegundos,
    esSimulada,
  }) => {
    const estado = determinarEstadoBateria(nivel, cargando);
    const tiempoRestante = calcularTiempoRestante(
      nivel,
      cargando,
      tiempoDescargaSegundos,
      tiempoCargaSegundos
    );

    set({
      nivel,
      cargando,
      estado,
      tiempoRestante,
      esSimulada,
    });
  },

  restablecer: () => {
    set(estadoInicial);
  },
}));
