import { PCB, EstadoProceso } from '../types';
import { PID_KERNEL } from './constantes';

export type ResultadoPausaUsuario = {
  procesosActualizados: PCB[];
  estadosPrevios: Record<number, EstadoProceso>;
};

export function pausarProcesosDeUsuario(
  procesos: PCB[],
  usuarioId: string
): ResultadoPausaUsuario {
  const estadosPrevios: Record<number, EstadoProceso> = {};

  const procesosActualizados = procesos.map((p) => {
    if (
      p.pid === PID_KERNEL ||
      p.usuarioId !== usuarioId ||
      p.estado === 'Terminado'
    ) {
      return p;
    }
    estadosPrevios[p.pid] = p.estado;
    return { ...p, estado: 'Pausado' as EstadoProceso };
  });

  return { procesosActualizados, estadosPrevios };
}

export function restaurarProcesosDeUsuario(
  procesos: PCB[],
  usuarioId: string,
  estadosPrevios: Record<number, EstadoProceso>
): PCB[] {
  return procesos.map((p) => {
    if (
      p.pid === PID_KERNEL ||
      p.usuarioId !== usuarioId ||
      p.estado !== 'Pausado'
    ) {
      return p;
    }
    const estadoPrevio = estadosPrevios[p.pid] ?? 'Listo';
    return { ...p, estado: estadoPrevio };
  });
}

export function terminarProcesosDeUsuario(
  procesos: PCB[],
  usuarioId: string
): PCB[] {
  return procesos.map((p) => {
    if (p.pid === PID_KERNEL || p.usuarioId !== usuarioId) {
      return p;
    }
    return { ...p, estado: 'Terminado' as EstadoProceso };
  });
}
