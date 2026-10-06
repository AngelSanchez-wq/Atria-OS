import { describe, it, expect } from 'vitest';
import { PCB } from '../types';
import {
  esProcesoProtegido,
  obtenerProcesosActivos,
  calcularMetricasMemoria,
} from './metricas';
import { PID_KERNEL, PROCESO_KERNEL_BASE } from './constantes';

describe('metricas del kernel', () => {
  it('identifica correctamente si el proceso es protegido (Kernel PID 1)', () => {
    expect(esProcesoProtegido(PROCESO_KERNEL_BASE)).toBe(true);
    expect(esProcesoProtegido({ pid: 2 } as PCB)).toBe(false);
  });

  it('obtiene procesos activos ordenados por PID ignorando terminados', () => {
    const lista: PCB[] = [
      { pid: 3, estado: 'Listo' } as PCB,
      { pid: 2, estado: 'Terminado' } as PCB,
      { pid: PID_KERNEL, estado: 'En ejecución' } as PCB,
    ];

    const activos = obtenerProcesosActivos(lista);
    expect(activos).toHaveLength(2);
    expect(activos[0].pid).toBe(1);
    expect(activos[1].pid).toBe(3);
  });

  it('calcula correctamente la memoria en uso y el color según el porcentaje', () => {
    const procesos: PCB[] = [
      { pid: 1, estado: 'En ejecución', memoriaMb: 120 } as PCB,
      { pid: 2, estado: 'En ejecución', memoriaMb: 100 } as PCB,
      { pid: 3, estado: 'Terminado', memoriaMb: 500 } as PCB,
    ];

    const res = calcularMetricasMemoria(procesos, 1000);
    expect(res.memoriaEnUso).toBe(220); // 120 + 100
    expect(res.porcentaje).toBe(22);
    expect(res.colorBarra).toBe('acento');

    // Superando el 80%
    const procesosPesados: PCB[] = [
      { pid: 1, estado: 'En ejecución', memoriaMb: 850 } as PCB,
    ];
    const resPesado = calcularMetricasMemoria(procesosPesados, 1000);
    expect(resPesado.porcentaje).toBe(85);
    expect(resPesado.colorBarra).toBe('calido');
  });
});
