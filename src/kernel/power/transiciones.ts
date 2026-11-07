import { PCB, EstadoProceso } from '../types';
import { PID_KERNEL, PROCESO_KERNEL_BASE } from '../processes/constantes';

export type EstadoEnergia =
  | 'encendiendo'
  | 'login'
  | 'activo'
  | 'bloqueado'
  | 'suspendido'
  | 'apagando'
  | 'reiniciando'
  | 'apagado';

const TRANSICIONES_VALIDAS: Record<EstadoEnergia, EstadoEnergia[]> = {
  encendiendo: ['login'],
  login: ['activo', 'apagando', 'reiniciando'],
  activo: ['bloqueado', 'suspendido', 'apagando', 'reiniciando', 'login'],
  bloqueado: ['activo', 'apagando', 'reiniciando'],
  suspendido: ['activo'],
  apagando: ['apagado'],
  reiniciando: ['encendiendo'],
  apagado: ['encendiendo'],
};

export function puedeTransicionar(
  origen: EstadoEnergia,
  destino: EstadoEnergia
): boolean {
  return TRANSICIONES_VALIDAS[origen]?.includes(destino) ?? false;
}

export function transicionarEnergia(
  origen: EstadoEnergia,
  destino: EstadoEnergia
): EstadoEnergia {
  if (!puedeTransicionar(origen, destino)) {
    throw new Error(
      `Transición de energía inválida: de '${origen}' a '${destino}'`
    );
  }
  return destino;
}

// ─── Transformaciones de procesos en eventos de energía ─────────────────────

export type ResultadoSuspension = {
  procesosPausados: PCB[];
  estadosPrevios: Record<number, EstadoProceso>;
};

export function pausarProcesosPorSuspension(procesos: PCB[]): ResultadoSuspension {
  const estadosPrevios: Record<number, EstadoProceso> = {};

  const procesosPausados = procesos.map((p) => {
    if (p.pid === PID_KERNEL || p.estado === 'Terminado') {
      return p;
    }
    estadosPrevios[p.pid] = p.estado;
    return { ...p, estado: 'Pausado' as EstadoProceso };
  });

  return { procesosPausados, estadosPrevios };
}

export function restaurarProcesosDeSuspension(
  procesos: PCB[],
  estadosPrevios: Record<number, EstadoProceso>
): PCB[] {
  return procesos.map((p) => {
    if (p.pid === PID_KERNEL || p.estado === 'Terminado') {
      return p;
    }
    const estadoPrevio = estadosPrevios[p.pid] ?? 'Listo';
    return { ...p, estado: estadoPrevio };
  });
}

export function limpiarProcesosPorReinicioOApagado(): PCB[] {
  return [PROCESO_KERNEL_BASE];
}
