import {
  INTERVALO_SIMULADOR_MS,
  INTERVALO_REVISION_MS,
  MAXIMO_NOTIFICACIONES_SIMULADAS,
} from '../../config/notificaciones';
import { proximaRevision } from '../../kernel/interrupts/reglas';
import { useNotificaciones } from '../../store/notificaciones';
import { NOTIFICACIONES_SEMILLA } from './semillas';

export type OpcionesSimulador = {
  intervaloSimuladorMs?: number;
  intervaloRevisionMs?: number;
  maximoSimuladas?: number;
};

/**
 * Inicia el simulador de notificaciones y la revisión periódica por lotes.
 *
 * CARACTERÍSTICAS:
 * - Emite notificaciones semilla en intervalos regulares hasta alcanzar el máximo.
 * - Ejecuta la revisión periódica por lotes al llegar cada ciclo programado.
 * - Es completamente cancelable y no deja temporizadores activos al detenerse.
 * - NO utiliza la API Notification del navegador ni solicita permisos de sistema.
 *
 * @returns Función de limpieza `detener()` para cancelar los temporizadores.
 */
export function iniciarSimuladorNotificaciones(
  opciones?: OpcionesSimulador
): () => void {
  const intervaloSimulador = opciones?.intervaloSimuladorMs ?? INTERVALO_SIMULADOR_MS;
  const intervaloRevision = opciones?.intervaloRevisionMs ?? INTERVALO_REVISION_MS;
  const maximo = opciones?.maximoSimuladas ?? MAXIMO_NOTIFICACIONES_SIMULADAS;

  let contadorGeneradas = 0;
  let temporizadorLlegada: ReturnType<typeof setInterval> | null = null;
  let temporizadorRevision: ReturnType<typeof setInterval> | null = null;

  // 1. Programar la primera revisión en el store
  useNotificaciones
    .getState()
    .establecerProximaRevision(proximaRevision(Date.now(), intervaloRevision));

  // 2. Temporizador para emitir notificaciones simuladas periódicamente
  temporizadorLlegada = setInterval(() => {
    if (contadorGeneradas >= maximo) {
      if (temporizadorLlegada !== null) {
        clearInterval(temporizadorLlegada);
        temporizadorLlegada = null;
      }
      return;
    }

    const semilla = NOTIFICACIONES_SEMILLA[contadorGeneradas % NOTIFICACIONES_SEMILLA.length];
    useNotificaciones.getState().recibir({
      tipo: semilla.tipo,
      urgencia: semilla.urgencia,
      titulo: semilla.titulo,
    });

    contadorGeneradas++;

    if (contadorGeneradas >= maximo && temporizadorLlegada !== null) {
      clearInterval(temporizadorLlegada);
      temporizadorLlegada = null;
    }
  }, intervaloSimulador);

  // 3. Temporizador para la revisión periódica automática (entrega de lote)
  temporizadorRevision = setInterval(() => {
    useNotificaciones.getState().entregarLote();
  }, intervaloRevision);

  // Función de parada y limpieza
  return () => {
    if (temporizadorLlegada !== null) {
      clearInterval(temporizadorLlegada);
      temporizadorLlegada = null;
    }
    if (temporizadorRevision !== null) {
      clearInterval(temporizadorRevision);
      temporizadorRevision = null;
    }
  };
}
