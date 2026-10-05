import { AppId, EstadoProceso, PCB, TipoApp } from '../types';
import { CONFIG_PROCESO, MEMORIA_TOTAL_MB } from './constantes';

// ─── Contador de PIDs ────────────────────────────────────────────────────────
// Función pura que recibe el PID más alto actual para calcular el siguiente,
// evitando estado mutable global en el kernel.

export function siguientePid(procesos: PCB[]): number {
  if (procesos.length === 0) return 1;
  return Math.max(...procesos.map((p) => p.pid)) + 1;
}

// ─── Memoria en uso ──────────────────────────────────────────────────────────

export function memoriaEnUso(procesos: PCB[]): number {
  return procesos
    .filter((p) => p.estado !== 'Terminado')
    .reduce((acc, p) => acc + p.memoriaMb, 0);
}

export function hayMemoriaDisponible(procesos: PCB[], appId: AppId): boolean {
  const necesita = CONFIG_PROCESO[appId].memoriaMb;
  return memoriaEnUso(procesos) + necesita <= MEMORIA_TOTAL_MB;
}

// ─── Crear ───────────────────────────────────────────────────────────────────

type OpcionesCrearProceso = {
  appId: AppId;
  usuarioId: string;
  tipoApp: TipoApp;
  url?: string;
  ahora: number; // timestamp epoch ms — inyectado para poder testearlo
  procesos: PCB[]; // lista actual para calcular el PID
};

export type ResultadoCrear =
  | { ok: true; proceso: PCB }
  | { ok: false; motivo: 'sin-memoria' };

export function crearProceso(opts: OpcionesCrearProceso): ResultadoCrear {
  const { appId, usuarioId, tipoApp, url, ahora, procesos } = opts;

  if (!hayMemoriaDisponible(procesos, appId)) {
    return { ok: false, motivo: 'sin-memoria' };
  }

  const config = CONFIG_PROCESO[appId];
  const proceso: PCB = {
    pid: siguientePid(procesos),
    nombre: appId,
    estado: 'Nuevo',
    prioridad: config.prioridad,
    memoriaMb: config.memoriaMb,
    usuarioId,
    creadoEn: ahora,
    tipoApp,
    url,
  };

  return { ok: true, proceso };
}

// ─── Cambiar estado ──────────────────────────────────────────────────────────

export function cambiarEstado(proceso: PCB, nuevoEstado: EstadoProceso): PCB {
  return { ...proceso, estado: nuevoEstado };
}

// ─── Terminar ────────────────────────────────────────────────────────────────

export function terminarProceso(proceso: PCB): PCB {
  return { ...proceso, estado: 'Terminado' };
}
