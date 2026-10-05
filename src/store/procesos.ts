import { create } from 'zustand';
import { PCB, AppId, EstadoProceso } from '../kernel/types';
import { crearProceso, cambiarEstado, terminarProceso } from '../kernel/processes/proceso';
import { APPS } from '../config/apps';

type ProcesosStore = {
  procesos: PCB[];
  /** Lanza un proceso para la app dada. Retorna el proceso creado o null si no hay memoria. */
  lanzar: (appId: AppId, usuarioId: string) => PCB | null;
  /** Cambia el estado de un proceso por su PID. */
  cambiarEstado: (pid: number, estado: EstadoProceso) => void;
  /** Marca un proceso como Terminado por su PID. */
  terminar: (pid: number) => void;
};

export const useProcesos = create<ProcesosStore>((set, get) => ({
  procesos: [],

  lanzar: (appId, usuarioId) => {
    const { procesos } = get();
    const info = APPS[appId];
    const tipoApp = info.modo === 'interna' ? 'interna' : info.url?.startsWith('http') ? 'web' : 'local';

    const resultado = crearProceso({
      appId,
      usuarioId,
      tipoApp,
      url: info.url,
      ahora: Date.now(),
      procesos,
    });

    if (!resultado.ok) return null;

    set({ procesos: [...procesos, resultado.proceso] });
    return resultado.proceso;
  },

  cambiarEstado: (pid, estado) => {
    set((s) => ({
      procesos: s.procesos.map((p) =>
        p.pid === pid ? cambiarEstado(p, estado) : p
      ),
    }));
  },

  terminar: (pid) => {
    set((s) => ({
      procesos: s.procesos.map((p) =>
        p.pid === pid ? terminarProceso(p) : p
      ),
    }));
  },
}));
