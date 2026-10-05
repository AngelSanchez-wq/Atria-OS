import { create } from 'zustand';
import { Tarea } from '../kernel/types';
import { terminarTarea } from '../kernel/tasks/transiciones';

export type EstadoTarea = 'en-curso' | 'pausada';

type TareasStore = {
  tareaActiva: Tarea | null;
  estado: EstadoTarea;
  segundosTranscurridos: number;
  pendientes: Tarea[];
  empezar: (tarea: Tarea, restoPendientes?: Tarea[]) => void;
  pausar: () => void;
  reanudar: () => void;
  terminar: () => void;
  avanzar: (segundos: number) => void;
};

export const useTareas = create<TareasStore>((set) => ({
  tareaActiva: null,
  estado: 'en-curso',
  segundosTranscurridos: 0,
  pendientes: [],

  empezar: (tarea, restoPendientes = []) =>
    set({
      tareaActiva: tarea,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: restoPendientes,
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
      const { siguienteActiva, nuevasPendientes } = terminarTarea(state.pendientes);
      return {
        tareaActiva: siguienteActiva,
        estado: 'en-curso',
        segundosTranscurridos: 0,
        pendientes: nuevasPendientes,
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
