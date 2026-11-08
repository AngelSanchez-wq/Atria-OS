import { create } from 'zustand';
import { Tarea } from '../kernel/types';
import {
  iniciarLogro,
  continuarLogro,
  type InfoTareaTerminada,
} from '../kernel/tasks/transiciones';

export type EstadoTarea = 'en-curso' | 'pausada';

type TareasStore = {
  tareaActiva: Tarea | null;
  estado: EstadoTarea;
  segundosTranscurridos: number;
  pendientes: Tarea[];
  ultimaTerminada: InfoTareaTerminada | null;
  enLogro: boolean;
  iniciada: boolean;
  empezar: (tarea: Tarea, restoPendientes?: Tarea[]) => void;
  pausar: () => void;
  reanudar: () => void;
  terminar: () => void;
  continuarTrasLogro: () => void;
  avanzar: (segundos: number) => void;
};

export const useTareas = create<TareasStore>((set) => ({
  tareaActiva: null,
  estado: 'en-curso',
  segundosTranscurridos: 0,
  pendientes: [],
  ultimaTerminada: null,
  enLogro: false,
  iniciada: false,

  empezar: (tarea, restoPendientes = []) =>
    set({
      tareaActiva: tarea,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: restoPendientes,
      enLogro: false,
      ultimaTerminada: null,
      iniciada: true,
    }),

  pausar: () =>
    set((state) => ({
      estado: state.tareaActiva ? 'pausada' : state.estado,
    })),

  reanudar: () =>
    set((state) => ({
      estado: state.tareaActiva ? 'en-curso' : state.estado,
    })),

  terminar: () =>
    set((state) => {
      if (!state.tareaActiva) return state;
      const resLogro = iniciarLogro(
        state.tareaActiva,
        state.segundosTranscurridos
      );
      return {
        ...state,
        ...resLogro,
      };
    }),

  continuarTrasLogro: () =>
    set((state) => {
      const res = continuarLogro(state.pendientes);
      return {
        ...state,
        tareaActiva: res.siguienteActiva,
        pendientes: res.nuevasPendientes,
        enLogro: res.enLogro,
        ultimaTerminada: res.ultimaTerminada,
        segundosTranscurridos: res.segundosTranscurridos,
        estado: res.estado,
      };
    }),

  avanzar: (segundos) =>
    set((state) => {
      if (state.estado === 'pausada' || !state.tareaActiva) return state;
      const limite = state.tareaActiva.minutos * 60;
      const nuevoTiempo = Math.min(state.segundosTranscurridos + segundos, limite);
      return { segundosTranscurridos: nuevoTiempo };
    }),
}));

