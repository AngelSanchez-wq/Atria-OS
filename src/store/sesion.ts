import { create } from 'zustand';
import type { Usuario, EstadoProceso, Tarea } from '../kernel/types';

export type EstadoTareasUsuario = {
  tareaActiva: Tarea | null;
  pendientes: Tarea[];
  estado: 'en-curso' | 'pausada';
  segundosTranscurridos: number;
};

type SesionEstado = {
  usuario: Usuario | null;
  estadosProcesosPorUsuario: Record<string, Record<number, EstadoProceso>>;
  tareasPorUsuario: Record<string, EstadoTareasUsuario>;
  ingresar: (usuario: Usuario) => void;
  salir: () => void;
  guardarEstadosUsuario: (
    usuarioId: string,
    estados: Record<number, EstadoProceso>
  ) => void;
  guardarTareasUsuario: (
    usuarioId: string,
    tareas: EstadoTareasUsuario
  ) => void;
  limpiarUsuario: (usuarioId: string) => void;
};

/** Quién está dentro del sistema; se comparte entre pantallas. */
export const useSesion = create<SesionEstado>((set) => ({
  usuario: null,
  estadosProcesosPorUsuario: {},
  tareasPorUsuario: {},
  ingresar: (usuario) => set({ usuario }),
  salir: () => set({ usuario: null }),
  guardarEstadosUsuario: (usuarioId, estados) =>
    set((s) => ({
      estadosProcesosPorUsuario: {
        ...s.estadosProcesosPorUsuario,
        [usuarioId]: estados,
      },
    })),
  guardarTareasUsuario: (usuarioId, tareas) =>
    set((s) => ({
      tareasPorUsuario: {
        ...s.tareasPorUsuario,
        [usuarioId]: tareas,
      },
    })),
  limpiarUsuario: (usuarioId) =>
    set((s) => {
      const nuevosProcesos = { ...s.estadosProcesosPorUsuario };
      delete nuevosProcesos[usuarioId];
      const nuevasTareas = { ...s.tareasPorUsuario };
      delete nuevasTareas[usuarioId];
      return {
        estadosProcesosPorUsuario: nuevosProcesos,
        tareasPorUsuario: nuevasTareas,
        usuario: s.usuario?.id === usuarioId ? null : s.usuario,
      };
    }),
}));
