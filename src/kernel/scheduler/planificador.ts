import { PCB } from '../types';
import { PID_KERNEL } from '../processes/constantes';
import {
  QUANTUM_BASE_TICKS,
  QUANTUM_FOCO_TICKS,
  ENVEJECIMIENTO_CADA_TICKS,
  BONUS_FOCO,
  PRIORIDAD_MAXIMA,
} from '../../config/planificador';
import { EstadoPlanificador, ResultadoTick } from './types';

/**
 * Determina el quantum inicial (en ticks simulados) correspondiente a un proceso.
 * Si el proceso tiene la ventana en foco activo del usuario, recibe un quantum extendido.
 */
export function quantumPara(proceso: PCB, idProcesoEnFoco: number | null): number {
  return proceso.pid === idProcesoEnFoco ? QUANTUM_FOCO_TICKS : QUANTUM_BASE_TICKS;
}

/**
 * Calcula la prioridad efectiva dinámica de un proceso considerando:
 * 1. Prioridad base estática.
 * 2. Bonificación por envejecimiento (+1 por cada ENVEJECIMIENTO_CADA_TICKS esperando).
 * 3. Bonificación por foco (+BONUS_FOCO si posee la ventana activa).
 * El resultado nunca supera PRIORIDAD_MAXIMA (10).
 */
export function calcularPrioridadEfectiva(
  proceso: PCB,
  idProcesoEnFoco: number | null
): number {
  const ticksEsperando = proceso.ticksEsperando ?? 0;
  const bonoEnvejecimiento = Math.floor(
    ticksEsperando / ENVEJECIMIENTO_CADA_TICKS
  );
  const bonoFoco = proceso.pid === idProcesoEnFoco ? BONUS_FOCO : 0;
  return Math.min(
    proceso.prioridad + bonoEnvejecimiento + bonoFoco,
    PRIORIDAD_MAXIMA
  );
}

/**
 * Incrementa en 1 los ticks esperando de un proceso en cola y recalcula
 * su prioridad efectiva por envejecimiento.
 */
export function aplicarEnvejecimiento(
  proceso: PCB,
  idProcesoEnFoco: number | null
): PCB {
  const ticksEsperando = (proceso.ticksEsperando ?? 0) + 1;
  const bonoEnvejecimiento = Math.floor(
    ticksEsperando / ENVEJECIMIENTO_CADA_TICKS
  );
  const bonoFoco = proceso.pid === idProcesoEnFoco ? BONUS_FOCO : 0;
  const prioridadEfectiva = Math.min(
    proceso.prioridad + bonoEnvejecimiento + bonoFoco,
    PRIORIDAD_MAXIMA
  );

  return {
    ...proceso,
    estado: 'Listo',
    ticksEsperando,
    prioridadEfectiva,
  };
}

/**
 * Selecciona el siguiente proceso a ejecutar entre una lista de candidatos elegibles.
 * Algoritmo determinista puro (sin Math.random):
 * 1. Mayor prioridad efectiva.
 * 2. Mayor tiempo esperando en cola (ticksEsperando).
 * 3. Menor PID (desempate determinista).
 */
export function elegirSiguiente(
  candidatos: PCB[],
  idProcesoEnFoco: number | null
): PCB | null {
  if (candidatos.length === 0) return null;

  const ordenados = [...candidatos].sort((a, b) => {
    const priorA = calcularPrioridadEfectiva(a, idProcesoEnFoco);
    const priorB = calcularPrioridadEfectiva(b, idProcesoEnFoco);
    if (priorB !== priorA) {
      return priorB - priorA;
    }

    const esperaA = a.ticksEsperando ?? 0;
    const esperaB = b.ticksEsperando ?? 0;
    if (esperaB !== esperaA) {
      return esperaB - esperaA;
    }

    return a.pid - b.pid;
  });

  return ordenados[0];
}

/**
 * Función pura central del planificador de CPU: ejecuta un tick de simulación.
 *
 * Reglas:
 * - Un solo procesador simulado: a lo sumo un proceso de usuario está 'En ejecución'.
 * - El Kernel (PID 1) no compite en la cola y siempre permanece 'En ejecución'.
 * - Procesos 'Pausado', 'Bloqueado', 'Terminado' no compiten ni reciben CPU.
 * - Round Robin con prioridades y envejecimiento:
 *   - Al agotar el quantum, cede la CPU y vuelve a 'Listo' con espera en 0.
 *   - Si un proceso en CPU es pausado o terminado, se expulsa inmediatamente de la CPU.
 * - Conteo de cambios de contexto:
 *   - Se incrementa únicamente cuando la CPU conmuta entre dos procesos distintos (de A a B).
 *   - NO se incrementa al pasar de CPU ociosa al primer proceso (decisión de diseño documentada:
 *     no hay costo de guardado de contexto de un proceso previo de usuario).
 *   - NO se incrementa si el mismo proceso continúa o renueva su turno por falta de rivales.
 */
export function avanzarTick(
  estadoPlanificador: EstadoPlanificador,
  procesos: PCB[],
  idProcesoEnFoco: number | null
): ResultadoTick {
  const nuevosTicks = estadoPlanificador.ticks + 1;
  const pidEnCpuPrevio = estadoPlanificador.procesoEnCpuPid;

  const procesoEnCpuPrevio =
    pidEnCpuPrevio !== null
      ? procesos.find((p) => p.pid === pidEnCpuPrevio) ?? null
      : null;

  // Comprobar si el proceso que estaba en CPU puede seguir ejecutando su turno
  const puedeContinuar =
    procesoEnCpuPrevio !== null &&
    procesoEnCpuPrevio.estado === 'En ejecución' &&
    (procesoEnCpuPrevio.quantumRestante ?? 0) > 0;

  let nuevoPidEnCpu: number | null = null;
  let procesoElegido: PCB | null = null;
  let esNuevoTurno = false;

  if (puedeContinuar && procesoEnCpuPrevio) {
    // Continúa el proceso actual consumiendo su quantum
    nuevoPidEnCpu = procesoEnCpuPrevio.pid;
    procesoElegido = procesoEnCpuPrevio;
    esNuevoTurno = false;
  } else {
    // El proceso previo agotó su quantum, o fue pausado/terminado/inexistente.
    // Reunir los candidatos elegibles en estado 'Listo' o 'Nuevo'
    const candidatos: PCB[] = [];

    for (const p of procesos) {
      if (p.pid === PID_KERNEL) continue;
      if (
        p.estado === 'Pausado' ||
        p.estado === 'Bloqueado' ||
        p.estado === 'Nuevo' ||
        p.estado === 'Terminado'
      ) {
        continue;
      }

      if (p.pid === pidEnCpuPrevio) {
        // El proceso que acaba de agotar quantum cede el turno y vuelve a 'Listo'
        candidatos.push({
          ...p,
          estado: 'Listo',
          ticksEsperando: 0,
          prioridadEfectiva: calcularPrioridadEfectiva({ ...p, ticksEsperando: 0 }, idProcesoEnFoco),
        });
      } else if (p.estado === 'Listo') {
        candidatos.push(p);
      }
    }

    procesoElegido = elegirSiguiente(candidatos, idProcesoEnFoco);
    nuevoPidEnCpu = procesoElegido ? procesoElegido.pid : null;
    esNuevoTurno = true;
  }

  // Contabilizar cambios de contexto:
  // Se incrementa si y solo si había un proceso previo en CPU y entra un proceso DISTINTO.
  let nuevosCambiosContexto = estadoPlanificador.cambiosContexto;
  if (
    pidEnCpuPrevio !== null &&
    nuevoPidEnCpu !== null &&
    pidEnCpuPrevio !== nuevoPidEnCpu
  ) {
    nuevosCambiosContexto += 1;
  }

  // Actualizar la lista completa de procesos
  const procesosActualizados = procesos.map((p) => {
    // 1. Kernel del sistema: siempre 'En ejecución' como proceso base
    if (p.pid === PID_KERNEL) {
      return {
        ...p,
        estado: 'En ejecución' as const,
        ticksEsperando: 0,
        prioridadEfectiva: p.prioridad,
      };
    }

    // 2. Proceso en CPU durante este tick
    if (p.pid === nuevoPidEnCpu && procesoElegido) {
      const quantumInicial = esNuevoTurno
        ? quantumPara(procesoElegido, idProcesoEnFoco)
        : (p.quantumRestante ?? QUANTUM_BASE_TICKS);

      return {
        ...p,
        estado: 'En ejecución' as const,
        ticksEnCpu: (p.ticksEnCpu ?? 0) + 1,
        quantumRestante: Math.max(quantumInicial - 1, 0),
        ticksEsperando: 0,
        prioridadEfectiva: calcularPrioridadEfectiva({ ...p, ticksEsperando: 0 }, idProcesoEnFoco),
      };
    }

    // 3. Procesos no planificables (Pausado, Bloqueado, Nuevo, Terminado)
    if (
      p.estado === 'Pausado' ||
      p.estado === 'Bloqueado' ||
      p.estado === 'Nuevo' ||
      p.estado === 'Terminado'
    ) {
      return p;
    }

    // 4. Procesos planificables en cola de espera (Listo)
    // Si era el proceso que estaba en CPU en el tick anterior y acaba de ceder turno este tick,
    // su espera en este tick pasa a 1.
    if (p.pid === pidEnCpuPrevio && esNuevoTurno) {
      const pConEsperaCero = { ...p, ticksEsperando: 0 };
      return aplicarEnvejecimiento(pConEsperaCero, idProcesoEnFoco);
    }

    // Procesos que ya estaban esperando: envejecen +1 tick
    return aplicarEnvejecimiento(p, idProcesoEnFoco);
  });

  return {
    nuevoEstado: {
      procesoEnCpuPid: nuevoPidEnCpu,
      ticks: nuevosTicks,
      cambiosContexto: nuevosCambiosContexto,
    },
    procesosActualizados,
  };
}
