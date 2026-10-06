import { describe, it, expect, beforeEach } from 'vitest';
import { useProcesos } from './procesos';
import { PROCESO_KERNEL_BASE, PID_KERNEL } from '../kernel/processes/constantes';

describe('Store Procesos', () => {
  beforeEach(() => {
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
  });

  it('inicia con el proceso base del kernel', () => {
    const { procesos } = useProcesos.getState();
    expect(procesos).toHaveLength(1);
    expect(procesos[0].pid).toBe(PID_KERNEL);
    expect(procesos[0].nombre).toBe('Kernel de Atria-OS');
  });

  it('lanzar crea un proceso y lo añade a la lista', () => {
    const proceso = useProcesos.getState().lanzar('timelapse', 'mateo');
    expect(proceso).not.toBeNull();
    expect(useProcesos.getState().procesos).toHaveLength(2);
    expect(useProcesos.getState().procesos[1].nombre).toBe('timelapse');
    expect(useProcesos.getState().procesos[1].estado).toBe('Nuevo');
  });

  it('no permite terminar el proceso protegido del kernel', () => {
    useProcesos.getState().terminar(PID_KERNEL);
    const kernel = useProcesos.getState().procesos.find((p) => p.pid === PID_KERNEL);
    expect(kernel?.estado).toBe('En ejecución');
  });

  it('terminar marca un proceso no protegido como Terminado', () => {
    const p = useProcesos.getState().lanzar('tagfs', 'mateo');
    expect(p).not.toBeNull();
    if (!p) return;

    useProcesos.getState().terminar(p.pid);
    const proceso = useProcesos.getState().procesos.find((proc) => proc.pid === p.pid);
    expect(proceso?.estado).toBe('Terminado');
  });
});
