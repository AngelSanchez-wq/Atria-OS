import { create } from 'zustand';
import { PCB, AppId, EstadoProceso } from '../kernel/types';
import { crearProceso, cambiarEstado, terminarProceso } from '../kernel/processes/proceso';
import { PROCESO_KERNEL_BASE, PID_KERNEL } from '../kernel/processes/constantes';
import { APPS } from '../config/apps';
import { registrar } from '../system/logging/servicio';

type ProcesosStore = {
  procesos: PCB[];
  /** Lanza un proceso para la app dada. Retorna el proceso creado o null si no hay memoria. */
  lanzar: (appId: AppId, usuarioId: string) => PCB | null;
  /** Cambia el estado de un proceso por su PID. */
  cambiarEstado: (pid: number, estado: EstadoProceso) => void;
  /** Marca un proceso como Terminado por su PID (los procesos protegidos no se pueden terminar). */
  terminar: (
    pid: number,
    opciones?: { autor?: string; desdeMonitor?: boolean }
  ) => void;
  /** Actualiza la lista completa de procesos (utilizado por el planificador de CPU). */
  actualizarProcesos: (procesos: PCB[]) => void;
};

export const useProcesos = create<ProcesosStore>((set, get) => ({
  procesos: [PROCESO_KERNEL_BASE],

  lanzar: (appId, usuarioId) => {
    const { procesos } = get();
    const info = APPS[appId];
    const tipoApp =
      info.modo === 'interna'
        ? 'interna'
        : info.url?.startsWith('http')
        ? 'web'
        : 'local';

    const resultado = crearProceso({
      appId,
      usuarioId,
      tipoApp,
      url: info.url,
      ahora: Date.now(),
      procesos,
    });

    if (!resultado.ok) {
      registrar({
        categoria: 'proceso',
        gravedad: 'aviso',
        mensaje: `Memoria insuficiente al abrir ${info.nombre}`,
        usuarioId,
      });
      return null;
    }

    registrar({
      categoria: 'proceso',
      gravedad: 'info',
      mensaje: `Proceso creado: ${info.nombre} (PID ${resultado.proceso.pid})`,
      usuarioId,
    });

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

  terminar: (pid, opciones) => {
    if (pid === PID_KERNEL) return; // Proceso protegido del kernel
    const proceso = get().procesos.find((p) => p.pid === pid);
    if (proceso && proceso.estado !== 'Terminado') {
      const infoApp = APPS[proceso.nombre as AppId];
      const nombreApp = infoApp ? infoApp.nombre : proceso.nombre;
      const mensaje = opciones?.desdeMonitor
        ? `Proceso terminado desde el monitor: ${nombreApp} (PID ${pid}) por ${opciones.autor ?? 'Administrador'}`
        : `Proceso terminado: ${nombreApp} (PID ${pid})`;

      registrar({
        categoria: 'proceso',
        gravedad: 'info',
        mensaje,
        usuarioId: proceso.usuarioId,
      });
    }

    set((s) => ({
      procesos: s.procesos.map((p) =>
        p.pid === pid ? terminarProceso(p) : p
      ),
    }));
  },

  actualizarProcesos: (nuevosProcesos) => {
    set({ procesos: nuevosProcesos });
  },
}));
