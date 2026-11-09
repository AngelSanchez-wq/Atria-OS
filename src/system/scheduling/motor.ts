import { INTERVALO_TICK_MS } from '../../config/planificador';
import { avanzarTick } from '../../kernel/scheduler/planificador';
import { usePlanificador } from '../../store/planificador';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { useSesion } from '../../store/sesion';
import { useEnergia } from '../../store/energia';

let temporizador: ReturnType<typeof setInterval> | null = null;
let desuscribirStore: (() => void) | null = null;

/**
 * Ejecuta un único paso/tick del planificador de procesos si se cumplen las
 * condiciones de operación (sesión activa, energía activa y planificador iniciado).
 */
export function ejecutarTickPlanificador(): void {
  // 1. Debe haber un usuario con sesión iniciada
  const usuario = useSesion.getState().usuario;
  if (!usuario) return;

  // 2. El sistema debe estar activo (no suspendido, bloqueado, apagando ni reiniciando)
  const estadoEnergia = useEnergia.getState().estado;
  if (estadoEnergia !== 'activo') return;

  // 3. El planificador debe estar en estado activo
  const planificadorState = usePlanificador.getState();
  if (!planificadorState.activo) return;

  // 4. Identificar qué proceso tiene la ventana en foco activo
  const { ventanas, focusPid } = useVentanas.getState();
  const ventanaEnfocada = ventanas.find(
    (v) => v.id === focusPid && v.estado !== 'minimizada'
  );
  const idProcesoEnFoco = ventanaEnfocada ? ventanaEnfocada.pid : null;

  // 5. Invocar la función pura central del kernel
  const procesos = useProcesos.getState().procesos;
  const resultado = avanzarTick(
    {
      procesoEnCpuPid: planificadorState.procesoEnCpuPid,
      ticks: planificadorState.ticks,
      cambiosContexto: planificadorState.cambiosContexto,
    },
    procesos,
    idProcesoEnFoco
  );

  // 6. Actualizar atómicamente los stores correspondientes
  useProcesos.getState().actualizarProcesos(resultado.procesosActualizados);
  planificadorState.aplicarTick(resultado.nuevoEstado);
}

/**
 * Inicia o reinicia el temporizador de simulación en base a la velocidad actual.
 */
function configurarTemporizador(): void {
  if (temporizador !== null) {
    clearInterval(temporizador);
    temporizador = null;
  }

  const { activo, velocidad } = usePlanificador.getState();
  if (!activo) return;

  const intervaloMs = Math.max(Math.floor(INTERVALO_TICK_MS / velocidad), 20);
  temporizador = setInterval(() => {
    ejecutarTickPlanificador();
  }, intervaloMs);
}

/**
 * Inicia el motor del planificador de procesos simulado.
 * Retorna una función de limpieza para detenerlo y limpiar recursos.
 */
export function iniciarMotorPlanificador(): () => void {
  detenerMotorPlanificador();

  // Escuchar cambios en `activo` o `velocidad` del planificador para reconfigurar el temporizador
  let velocidadPrevia = usePlanificador.getState().velocidad;
  let activoPrevio = usePlanificador.getState().activo;

  desuscribirStore = usePlanificador.subscribe((state) => {
    if (state.velocidad !== velocidadPrevia || state.activo !== activoPrevio) {
      velocidadPrevia = state.velocidad;
      activoPrevio = state.activo;
      configurarTemporizador();
    }
  });

  configurarTemporizador();

  return detenerMotorPlanificador;
}

/**
 * Detiene el motor del planificador y limpia completamente los temporizadores
 * y suscripciones para evitar fugas de memoria.
 */
export function detenerMotorPlanificador(): void {
  if (temporizador !== null) {
    clearInterval(temporizador);
    temporizador = null;
  }

  if (desuscribirStore !== null) {
    desuscribirStore();
    desuscribirStore = null;
  }
}
