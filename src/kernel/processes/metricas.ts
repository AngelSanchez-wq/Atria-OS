import { PCB } from '../types';
import { PID_KERNEL, MEMORIA_TOTAL_MB } from './constantes';

export function esProcesoProtegido(proceso: PCB): boolean {
  return proceso.pid === PID_KERNEL;
}

export function obtenerProcesosActivos(procesos: PCB[]): PCB[] {
  return procesos
    .filter((p) => p.estado !== 'Terminado')
    .sort((a, b) => a.pid - b.pid);
}

export type MetricasMemoria = {
  memoriaEnUso: number;
  totalMb: number;
  porcentaje: number;
  colorBarra: 'acento' | 'calido';
};

export function calcularMetricasMemoria(
  procesos: PCB[],
  totalMb: number = MEMORIA_TOTAL_MB
): MetricasMemoria {
  const memoriaEnUso = procesos
    .filter((p) => p.estado !== 'Terminado')
    .reduce((acc, p) => acc + p.memoriaMb, 0);

  const porcentaje = totalMb > 0
    ? Math.min(100, Math.max(0, Math.round((memoriaEnUso / totalMb) * 100)))
    : 0;

  const colorBarra: 'acento' | 'calido' = porcentaje > 80 ? 'calido' : 'acento';

  return {
    memoriaEnUso,
    totalMb,
    porcentaje,
    colorBarra,
  };
}
