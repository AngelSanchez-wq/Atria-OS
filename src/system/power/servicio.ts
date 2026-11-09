import { platform } from '../../platform/web';
import { useBateriaStore } from '../../store/bateria';
import { useNotificaciones } from '../../store/notificaciones';
import { registrar } from '../logging/servicio';
import {
  UMBRAL_BATERIA_BAJA,
  UMBRAL_BATERIA_CRITICA,
} from '../../kernel/power/bateria';

let desuscribirBateria: (() => void) | null = null;
let avisoBajaEmitido = false;
let avisoCriticaEmitido = false;

/**
 * Evalúa los umbrales de batería (≤ 20 % y ≤ 10 %) y emite UNA sola notificación
 * en Burble y un evento en el registro si no se ha emitido previamente y no existe
 * una notificación equivalente sin leer.
 */
export function procesarAlertasBateria(nivel: number, cargando: boolean): void {
  // Si está cargando o por encima del umbral, restablecer los banderines de alerta
  if (cargando) {
    avisoBajaEmitido = false;
    avisoCriticaEmitido = false;
    return;
  }

  if (nivel > UMBRAL_BATERIA_BAJA) {
    avisoBajaEmitido = false;
    avisoCriticaEmitido = false;
    return;
  }

  if (nivel > UMBRAL_BATERIA_CRITICA) {
    avisoCriticaEmitido = false;
  }

  const notificaciones = useNotificaciones.getState().notificaciones;

  // Umbral crítico: ≤ 10 %
  if (nivel <= UMBRAL_BATERIA_CRITICA) {
    if (!avisoCriticaEmitido) {
      const yaExisteSinLeer = notificaciones.some(
        (n) =>
          n.titulo === 'Batería crítica: conviene suspender' &&
          n.estado !== 'leida'
      );

      if (!yaExisteSinLeer) {
        useNotificaciones.getState().recibir({
          tipo: 'sistema',
          urgencia: 5,
          titulo: 'Batería crítica: conviene suspender',
          detalle:
            'La batería ha caído al 10 % o menos. Guarda tu trabajo o conecta el cargador.',
        });

        registrar({
          categoria: 'energia',
          gravedad: 'aviso',
          mensaje: 'Batería crítica (≤ 10 %)',
        });
      }

      avisoCriticaEmitido = true;
      avisoBajaEmitido = true; // El aviso crítico absorbe el aviso bajo
    }
    return;
  }

  // Umbral bajo: ≤ 20 %
  if (nivel <= UMBRAL_BATERIA_BAJA) {
    if (!avisoBajaEmitido) {
      const yaExisteSinLeer = notificaciones.some(
        (n) => n.titulo === 'Batería baja' && n.estado !== 'leida'
      );

      if (!yaExisteSinLeer) {
        useNotificaciones.getState().recibir({
          tipo: 'sistema',
          urgencia: 3,
          titulo: 'Batería baja',
          detalle: 'Queda 20 % o menos de batería.',
        });

        registrar({
          categoria: 'energia',
          gravedad: 'aviso',
          mensaje: 'Batería baja (≤ 20 %)',
        });
      }

      avisoBajaEmitido = true;
    }
  }
}

/**
 * Inicia el servicio de sincronización de batería con la capa Platform.
 *
 * @returns Función de limpieza para cancelar escuchadores.
 */
export function iniciarServicioBateria(): () => void {
  detenerServicioBateria();

  // Sincronizar estado inicial
  platform.getBatteryStatus().then((estado) => {
    useBateriaStore.getState().actualizarBateria(estado);
    procesarAlertasBateria(estado.nivel, estado.cargando);
  });

  // Escuchar cambios de batería
  desuscribirBateria = platform.onBatteryChange((estado) => {
    useBateriaStore.getState().actualizarBateria(estado);
    procesarAlertasBateria(estado.nivel, estado.cargando);
  });

  return detenerServicioBateria;
}

/**
 * Detiene el servicio de batería y reinicia los banderines de alerta.
 */
export function detenerServicioBateria(): void {
  if (desuscribirBateria !== null) {
    desuscribirBateria();
    desuscribirBateria = null;
  }
  avisoBajaEmitido = false;
  avisoCriticaEmitido = false;
}
