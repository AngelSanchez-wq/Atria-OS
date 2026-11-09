import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  iniciarMotorPlanificador,
  detenerMotorPlanificador,
  ejecutarTickPlanificador,
} from './motor';
import { usePlanificador } from '../../store/planificador';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { useEnergia } from '../../store/energia';
import { useVentanas } from '../../store/ventanas';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import { PCB } from '../../kernel/types';

describe('Motor de simulación del planificador', () => {
  const usuarioActivo = USUARIOS_SEMILLA[0];

  beforeEach(() => {
    vi.useFakeTimers();
    usePlanificador.getState().restablecer();
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
    useSesion.setState({ usuario: usuarioActivo });
    useEnergia.setState({ estado: 'activo' });
  });

  afterEach(() => {
    detenerMotorPlanificador();
    vi.useRealTimers();
  });

  it('no avanza ticks si no hay sesión activa', () => {
    useSesion.setState({ usuario: null });
    usePlanificador.getState().iniciar();

    const proc: PCB = {
      pid: 2,
      nombre: 'focuspad',
      estado: 'Listo',
      prioridad: 5,
      prioridadEfectiva: 5,
      ticksEsperando: 0,
      quantumRestante: 3,
      ticksEnCpu: 0,
      memoriaMb: 64,
      usuarioId: 'u1',
      creadoEn: 1000,
      tipoApp: 'interna',
    };
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, proc] });

    ejecutarTickPlanificador();
    expect(usePlanificador.getState().ticks).toBe(0);
    expect(usePlanificador.getState().procesoEnCpuPid).toBeNull();
  });

  it('se pausa si el estado del sistema es bloqueado o suspendido', () => {
    usePlanificador.getState().iniciar();

    // Estado bloqueado
    useEnergia.setState({ estado: 'bloqueado' });
    ejecutarTickPlanificador();
    expect(usePlanificador.getState().ticks).toBe(0);

    // Estado suspendido
    useEnergia.setState({ estado: 'suspendido' });
    ejecutarTickPlanificador();
    expect(usePlanificador.getState().ticks).toBe(0);

    // Vuelve a activo -> avanza
    useEnergia.setState({ estado: 'activo' });
    ejecutarTickPlanificador();
    expect(usePlanificador.getState().ticks).toBe(1);
  });

  it('avanza con el tiempo con temporizadores falsos y respeta la velocidad de simulación', () => {
    const proc: PCB = {
      pid: 2,
      nombre: 'focuspad',
      estado: 'Listo',
      prioridad: 5,
      prioridadEfectiva: 5,
      ticksEsperando: 0,
      quantumRestante: 3,
      ticksEnCpu: 0,
      memoriaMb: 64,
      usuarioId: 'u1',
      creadoEn: 1000,
      tipoApp: 'interna',
    };
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, proc] });

    usePlanificador.getState().iniciar();
    const limpiar = iniciarMotorPlanificador();

    // A velocidad 1x (1000 ms por tick)
    vi.advanceTimersByTime(1000);
    expect(usePlanificador.getState().ticks).toBe(1);

    vi.advanceTimersByTime(2000);
    expect(usePlanificador.getState().ticks).toBe(3);

    // Cambiar a velocidad 5x (200 ms por tick)
    usePlanificador.getState().cambiarVelocidad(5);
    vi.advanceTimersByTime(1000); // 1000 ms / 200 ms = 5 ticks más
    expect(usePlanificador.getState().ticks).toBe(8);

    limpiar();
    // Después de limpiar no debe avanzar más
    vi.advanceTimersByTime(5000);
    expect(usePlanificador.getState().ticks).toBe(8);
  });
});
