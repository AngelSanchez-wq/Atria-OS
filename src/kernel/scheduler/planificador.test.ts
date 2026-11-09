import { describe, it, expect } from 'vitest';
import {
  avanzarTick,
  elegirSiguiente,
  aplicarEnvejecimiento,
  quantumPara,
  calcularPrioridadEfectiva,
} from './planificador';
import { EstadoPlanificador } from './types';
import { PCB } from '../types';
import { PROCESO_KERNEL_BASE } from '../processes/constantes';
import {
  QUANTUM_BASE_TICKS,
  QUANTUM_FOCO_TICKS,
  BONUS_FOCO,
  ENVEJECIMIENTO_CADA_TICKS,
} from '../../config/planificador';

function crearPcbMock(datos: Partial<PCB> & { pid: number; nombre: string }): PCB {
  const prioridad = datos.prioridad ?? 5;
  return {
    pid: datos.pid,
    nombre: datos.nombre,
    estado: datos.estado ?? 'Listo',
    prioridad,
    prioridadEfectiva: datos.prioridadEfectiva ?? prioridad,
    ticksEsperando: datos.ticksEsperando ?? 0,
    quantumRestante: datos.quantumRestante ?? QUANTUM_BASE_TICKS,
    ticksEnCpu: datos.ticksEnCpu ?? 0,
    memoriaMb: datos.memoriaMb ?? 32,
    usuarioId: datos.usuarioId ?? 'usuario-test',
    creadoEn: datos.creadoEn ?? 1000,
    tipoApp: datos.tipoApp ?? 'interna',
    esDemo: datos.esDemo,
  };
}

describe('Planificador de procesos simulado (lógica pura)', () => {
  const estadoInicial: EstadoPlanificador = {
    procesoEnCpuPid: null,
    ticks: 0,
    cambiosContexto: 0,
  };

  it('el kernel (PID 1) nunca se planifica ni compite en la cola de listos', () => {
    const procesos = [PROCESO_KERNEL_BASE];
    const { nuevoEstado, procesosActualizados } = avanzarTick(estadoInicial, procesos, null);

    // CPU queda ociosa para procesos de usuario
    expect(nuevoEstado.procesoEnCpuPid).toBeNull();
    expect(nuevoEstado.ticks).toBe(1);
    expect(nuevoEstado.cambiosContexto).toBe(0);

    // Kernel permanece inmutable como 'En ejecución'
    const kernel = procesosActualizados.find((p) => p.pid === 1);
    expect(kernel?.estado).toBe('En ejecución');
    expect(kernel?.ticksEsperando).toBe(0);
  });

  it('un solo proceso de usuario toma la CPU, consume su quantum y lo renueva sin sumar cambios de contexto', () => {
    const p1 = crearPcbMock({ pid: 2, nombre: 'FocusPad', prioridad: 5 });
    let estado = estadoInicial;
    let procesos = [PROCESO_KERNEL_BASE, p1];

    // Tick 1: P1 toma la CPU (de ocioso a primer proceso -> cambiosContexto = 0)
    let res = avanzarTick(estado, procesos, null);
    estado = res.nuevoEstado;
    procesos = res.procesosActualizados;

    expect(estado.procesoEnCpuPid).toBe(2);
    expect(estado.ticks).toBe(1);
    expect(estado.cambiosContexto).toBe(0);
    let procP1 = procesos.find((p) => p.pid === 2)!;
    expect(procP1.estado).toBe('En ejecución');
    expect(procP1.ticksEnCpu).toBe(1);
    expect(procP1.quantumRestante).toBe(QUANTUM_BASE_TICKS - 1); // 2

    // Tick 2: P1 continúa
    res = avanzarTick(estado, procesos, null);
    estado = res.nuevoEstado;
    procesos = res.procesosActualizados;
    procP1 = procesos.find((p) => p.pid === 2)!;
    expect(procP1.quantumRestante).toBe(1);
    expect(procP1.ticksEnCpu).toBe(2);
    expect(estado.cambiosContexto).toBe(0);

    // Tick 3: P1 consume su último tick del quantum
    res = avanzarTick(estado, procesos, null);
    estado = res.nuevoEstado;
    procesos = res.procesosActualizados;
    procP1 = procesos.find((p) => p.pid === 2)!;
    expect(procP1.quantumRestante).toBe(0);
    expect(procP1.ticksEnCpu).toBe(3);

    // Tick 4: Quantum agotado. Al no haber otros procesos, renueva quantum
    res = avanzarTick(estado, procesos, null);
    estado = res.nuevoEstado;
    procesos = res.procesosActualizados;
    procP1 = procesos.find((p) => p.pid === 2)!;
    expect(estado.procesoEnCpuPid).toBe(2);
    // Mismo proceso en CPU: no cuenta como cambio de contexto
    expect(estado.cambiosContexto).toBe(0);
    expect(procP1.ticksEnCpu).toBe(4);
    expect(procP1.quantumRestante).toBe(QUANTUM_BASE_TICKS - 1);
  });

  it('dos procesos con igual prioridad alternan equitativamente por Round Robin', () => {
    const pA = crearPcbMock({ pid: 2, nombre: 'A', prioridad: 5 });
    const pB = crearPcbMock({ pid: 3, nombre: 'B', prioridad: 5 });
    let estado = estadoInicial;
    let procesos = [PROCESO_KERNEL_BASE, pA, pB];

    // Ticks 1, 2, 3: Ejecuta A (PID menor desempata al inicio)
    for (let t = 1; t <= 3; t++) {
      const res = avanzarTick(estado, procesos, null);
      estado = res.nuevoEstado;
      procesos = res.procesosActualizados;
      expect(estado.procesoEnCpuPid).toBe(2);
    }

    expect(estado.cambiosContexto).toBe(0);
    const procBEsperando = procesos.find((p) => p.pid === 3)!;
    expect(procBEsperando.ticksEsperando).toBe(3);

    // Tick 4: Quantum de A agotado -> Cambia a B (Cambio de contexto: 1)
    const res4 = avanzarTick(estado, procesos, null);
    estado = res4.nuevoEstado;
    procesos = res4.procesosActualizados;

    expect(estado.procesoEnCpuPid).toBe(3);
    expect(estado.cambiosContexto).toBe(1);
    const procB = procesos.find((p) => p.pid === 3)!;
    expect(procB.estado).toBe('En ejecución');
    expect(procB.ticksEnCpu).toBe(1);

    // Ticks 5 y 6: B completa su quantum
    for (let t = 5; t <= 6; t++) {
      const res = avanzarTick(estado, procesos, null);
      estado = res.nuevoEstado;
      procesos = res.procesosActualizados;
      expect(estado.procesoEnCpuPid).toBe(3);
    }

    // Tick 7: Quantum de B agotado -> Cambia de regreso a A (Cambio de contexto: 2)
    const res7 = avanzarTick(estado, procesos, null);
    estado = res7.nuevoEstado;
    procesos = res7.procesosActualizados;

    expect(estado.procesoEnCpuPid).toBe(2);
    expect(estado.cambiosContexto).toBe(2);
    const procA = procesos.find((p) => p.pid === 2)!;
    expect(procA.estado).toBe('En ejecución');
  });

  it('procesos con prioridades distintas: ejecuta el de mayor prioridad', () => {
    const baja = crearPcbMock({ pid: 2, nombre: 'Baja', prioridad: 3 });
    const alta = crearPcbMock({ pid: 3, nombre: 'Alta', prioridad: 8 });
    const estado = estadoInicial;
    const procesos = [PROCESO_KERNEL_BASE, baja, alta];

    const res = avanzarTick(estado, procesos, null);
    expect(res.nuevoEstado.procesoEnCpuPid).toBe(3);
    expect(res.procesosActualizados.find((p) => p.pid === 3)?.estado).toBe('En ejecución');
    expect(res.procesosActualizados.find((p) => p.pid === 2)?.estado).toBe('Listo');
  });

  it('el envejecimiento previene la inanición de procesos de baja prioridad', () => {
    // Proceso A con prioridad 5; Proceso B con prioridad 3
    const pA = crearPcbMock({ pid: 2, nombre: 'A', prioridad: 5 });
    const pB = crearPcbMock({ pid: 3, nombre: 'B', prioridad: 3 });
    let estado = estadoInicial;
    let procesos = [PROCESO_KERNEL_BASE, pA, pB];

    // En los primeros 6 ticks (2 quantums completos), ejecuta A
    for (let t = 1; t <= 6; t++) {
      const res = avanzarTick(estado, procesos, null);
      estado = res.nuevoEstado;
      procesos = res.procesosActualizados;
      expect(estado.procesoEnCpuPid).toBe(2);
    }

    // En tick 6: B ha esperado 6 ticks -> bono envejecimiento = floor(6/3) = +2
    // Prioridad efectiva de B = 3 + 2 = 5 (empata con A en 5)
    // Pero B lleva 6 ticks esperando frente a A que acaba de agotar quantum (espera 0)
    // Por tanto, en el tick 7 ¡B gana la CPU!
    const res7 = avanzarTick(estado, procesos, null);
    estado = res7.nuevoEstado;
    procesos = res7.procesosActualizados;

    expect(estado.procesoEnCpuPid).toBe(3);
    const procB = procesos.find((p) => p.pid === 3)!;
    expect(procB.estado).toBe('En ejecución');
  });

  it('el proceso con la ventana en foco recibe bono de prioridad y quantum extendido', () => {
    const normal = crearPcbMock({ pid: 2, nombre: 'Normal', prioridad: 5 });
    const enfocado = crearPcbMock({ pid: 3, nombre: 'Enfocado', prioridad: 4 });
    let estado = estadoInicial;
    // Enfocado tiene base 4, pero con BONUS_FOCO (+2) su prioridad efectiva es 6 (> 5)
    let procesos = [PROCESO_KERNEL_BASE, normal, enfocado];

    // Tick 1: gana el enfocado
    let res = avanzarTick(estado, procesos, 3);
    estado = res.nuevoEstado;
    procesos = res.procesosActualizados;

    expect(estado.procesoEnCpuPid).toBe(3);
    const procEnf = procesos.find((p) => p.pid === 3)!;
    expect(procEnf.prioridadEfectiva).toBe(4 + BONUS_FOCO);
    // Su quantum inicial debe haber sido QUANTUM_FOCO_TICKS (6), consumió 1 tick -> 5 restantes
    expect(procEnf.quantumRestante).toBe(QUANTUM_FOCO_TICKS - 1);

    // Debe ejecutar durante 6 ticks antes de ceder el turno
    for (let t = 2; t <= 6; t++) {
      res = avanzarTick(estado, procesos, 3);
      estado = res.nuevoEstado;
      procesos = res.procesosActualizados;
      expect(estado.procesoEnCpuPid).toBe(3);
    }

    const procDespuesDe6 = procesos.find((p) => p.pid === 3)!;
    expect(procDespuesDe6.ticksEnCpu).toBe(6);
    expect(procDespuesDe6.quantumRestante).toBe(0);
  });

  it('CPU queda ociosa si no hay procesos listos (Pausado, Bloqueado, Nuevo, Terminado no compiten)', () => {
    const pausado = crearPcbMock({ pid: 2, nombre: 'Pausado', estado: 'Pausado' });
    const terminado = crearPcbMock({ pid: 3, nombre: 'Terminado', estado: 'Terminado' });
    const nuevo = crearPcbMock({ pid: 4, nombre: 'Nuevo', estado: 'Nuevo' });
    const procesos = [PROCESO_KERNEL_BASE, pausado, terminado, nuevo];

    const res = avanzarTick(estadoInicial, procesos, null);
    expect(res.nuevoEstado.procesoEnCpuPid).toBeNull();
    expect(res.nuevoEstado.cambiosContexto).toBe(0);
    expect(res.nuevoEstado.ticks).toBe(1);
    expect(res.procesosActualizados.find((p) => p.pid === 4)?.estado).toBe('Nuevo');
  });

  it('proceso pausado o terminado a mitad de turno cede inmediatamente la CPU', () => {
    const p1 = crearPcbMock({
      pid: 2,
      nombre: 'P1',
      estado: 'En ejecución',
      quantumRestante: 2,
    });
    const p2 = crearPcbMock({ pid: 3, nombre: 'P2', estado: 'Listo', prioridad: 5 });

    const estado: EstadoPlanificador = {
      procesoEnCpuPid: 2,
      ticks: 2,
      cambiosContexto: 0,
    };

    // Simulamos que el usuario pausa P1 desde el monitor
    const p1Pausado = { ...p1, estado: 'Pausado' as const };
    const procesos = [PROCESO_KERNEL_BASE, p1Pausado, p2];

    const res = avanzarTick(estado, procesos, null);
    // P2 debe tomar la CPU inmediatamente
    expect(res.nuevoEstado.procesoEnCpuPid).toBe(3);
    expect(res.nuevoEstado.cambiosContexto).toBe(1);
    expect(res.procesosActualizados.find((p) => p.pid === 3)?.estado).toBe('En ejecución');
  });

  it('las funciones puras son totalmente deterministas ante iguales condiciones', () => {
    const pA = crearPcbMock({ pid: 2, nombre: 'A', prioridad: 5, ticksEsperando: 2 });
    const pB = crearPcbMock({ pid: 3, nombre: 'B', prioridad: 5, ticksEsperando: 2 });

    const elegido1 = elegirSiguiente([pA, pB], null);
    const elegido2 = elegirSiguiente([pA, pB], null);

    expect(elegido1?.pid).toBe(elegido2?.pid);
    expect(elegido1?.pid).toBe(2); // Desempate por menor PID
  });

  it('funciones auxiliares puras: quantumPara, calcularPrioridadEfectiva y aplicarEnvejecimiento', () => {
    const pNormal = crearPcbMock({ pid: 2, nombre: 'Normal', prioridad: 4, ticksEsperando: 0 });
    expect(quantumPara(pNormal, null)).toBe(QUANTUM_BASE_TICKS);
    expect(quantumPara(pNormal, 2)).toBe(QUANTUM_FOCO_TICKS);

    // Bono de foco
    expect(calcularPrioridadEfectiva(pNormal, 2)).toBe(4 + BONUS_FOCO);

    // Envejecimiento: cada ENVEJECIMIENTO_CADA_TICKS ticks esperando suma +1 de prioridad
    const pEsperando = { ...pNormal, ticksEsperando: ENVEJECIMIENTO_CADA_TICKS * 2 };
    expect(calcularPrioridadEfectiva(pEsperando, null)).toBe(4 + 2);

    const envejecido = aplicarEnvejecimiento(pNormal, null);
    expect(envejecido.ticksEsperando).toBe(1);
    expect(envejecido.estado).toBe('Listo');
  });
});
