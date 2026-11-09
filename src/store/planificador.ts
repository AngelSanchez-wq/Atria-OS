import { create } from 'zustand';
import { PCB } from '../kernel/types';
import { siguientePid, memoriaEnUso } from '../kernel/processes/proceso';
import { MEMORIA_TOTAL_MB } from '../kernel/processes/constantes';
import {
  QUANTUM_BASE_TICKS,
  VELOCIDADES_PLANIFICADOR,
  VelocidadPlanificador,
  PROCESOS_DEMO,
} from '../config/planificador';
import { useProcesos } from './procesos';
import { registrar } from '../system/logging/servicio';

export type PlanificadorEstado = {
  /** Indica si la simulación del planificador está en ejecución activa. */
  activo: boolean;
  /** Multiplicador de velocidad de simulación actual (×1, ×5, ×10). */
  velocidad: VelocidadPlanificador;
  /** Contador global de ticks simulados transcurridos. */
  ticks: number;
  /** Cantidad de cambios de contexto entre procesos realizados. */
  cambiosContexto: number;
  /** PID del proceso de usuario actualmente ejecutando en la CPU simulada (null si ociosa). */
  procesoEnCpuPid: number | null;

  iniciar: () => void;
  detener: () => void;
  cambiarVelocidad: (velocidad: VelocidadPlanificador) => void;
  agregarProcesosDePrueba: () => { agregados: number; rechazados: number };
  quitarProcesosDePrueba: () => void;
  /** Sincroniza el estado del planificador tras la ejecución de un tick. */
  aplicarTick: (datos: {
    ticks: number;
    cambiosContexto: number;
    procesoEnCpuPid: number | null;
  }) => void;
  restablecer: () => void;
};

export const usePlanificador = create<PlanificadorEstado>((set, get) => ({
  activo: false,
  velocidad: 1,
  ticks: 0,
  cambiosContexto: 0,
  procesoEnCpuPid: null,

  iniciar: () => {
    set({ activo: true });
  },

  detener: () => {
    set({ activo: false });
  },

  cambiarVelocidad: (velocidad) => {
    if (!VELOCIDADES_PLANIFICADOR.includes(velocidad)) return;
    set({ velocidad });
    registrar({
      categoria: 'proceso',
      gravedad: 'info',
      mensaje: `Velocidad del planificador cambiada a ×${velocidad}`,
    });
  },

  agregarProcesosDePrueba: () => {
    const procesosStore = useProcesos.getState();
    let listaActual = [...procesosStore.procesos];
    let agregados = 0;
    let rechazados = 0;

    for (const demo of PROCESOS_DEMO) {
      // Verificar si ya existe un proceso demo activo con ese nombre
      const yaExiste = listaActual.some(
        (p) => p.esDemo && p.nombre === demo.nombre && p.estado !== 'Terminado'
      );
      if (yaExiste) {
        continue;
      }

      // Comprobar si hay suficiente memoria simulada disponible en el sistema
      if (memoriaEnUso(listaActual) + demo.memoriaMb > MEMORIA_TOTAL_MB) {
        rechazados++;
        continue;
      }

      const nuevoPid = siguientePid(listaActual);
      const nuevoProceso: PCB = {
        pid: nuevoPid,
        nombre: demo.nombre,
        estado: 'Listo',
        prioridad: demo.prioridad,
        prioridadEfectiva: demo.prioridad,
        ticksEsperando: 0,
        quantumRestante: QUANTUM_BASE_TICKS,
        ticksEnCpu: 0,
        memoriaMb: demo.memoriaMb,
        usuarioId: 'demo',
        creadoEn: Date.now(),
        tipoApp: 'interna',
        esDemo: true,
      };

      listaActual = [...listaActual, nuevoProceso];
      agregados++;
    }

    if (agregados > 0) {
      procesosStore.actualizarProcesos(listaActual);
      registrar({
        categoria: 'proceso',
        gravedad: 'info',
        mensaje: `Añadidos ${agregados} procesos de prueba al planificador (${agregados} creados, ${rechazados} rechazados por memoria)`,
      });
    }

    return { agregados, rechazados };
  },

  quitarProcesosDePrueba: () => {
    const procesosStore = useProcesos.getState();
    const procesosNoDemo = procesosStore.procesos.filter((p) => !p.esDemo);
    const cantEliminados = procesosStore.procesos.length - procesosNoDemo.length;

    if (cantEliminados > 0) {
      procesosStore.actualizarProcesos(procesosNoDemo);

      // Si el proceso en CPU era uno de los de prueba, liberar la CPU
      const enCpuPid = get().procesoEnCpuPid;
      if (enCpuPid !== null && !procesosNoDemo.some((p) => p.pid === enCpuPid)) {
        set({ procesoEnCpuPid: null });
      }

      registrar({
        categoria: 'proceso',
        gravedad: 'info',
        mensaje: `Eliminados ${cantEliminados} procesos de prueba del planificador`,
      });
    }
  },

  aplicarTick: (datos) => {
    set({
      ticks: datos.ticks,
      cambiosContexto: datos.cambiosContexto,
      procesoEnCpuPid: datos.procesoEnCpuPid,
    });
  },

  restablecer: () => {
    set({
      activo: false,
      velocidad: 1,
      ticks: 0,
      cambiosContexto: 0,
      procesoEnCpuPid: null,
    });
  },
}));
