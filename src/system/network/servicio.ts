import { platform } from '../../platform/web';
import { useRedStore } from '../../store/red';

let desuscribirRed: (() => void) | null = null;

/**
 * Inicia el servicio de sincronización de estado de red con la capa Platform.
 *
 * @returns Función de limpieza para detener la escucha.
 */
export function iniciarServicioRed(): () => void {
  detenerServicioRed();

  // Sincronizar estado inicial
  const estadoInicial = platform.getNetworkStatus();
  useRedStore.getState().setEnLinea(estadoInicial.enLinea, estadoInicial.calidad);

  // Escuchar cambios de conectividad (online/offline) y calidad
  desuscribirRed = platform.onNetworkChange((estado) => {
    useRedStore.getState().setEnLinea(estado.enLinea, estado.calidad);
  });

  return detenerServicioRed;
}

/**
 * Detiene el servicio de red y remueve escuchadores activos.
 */
export function detenerServicioRed(): void {
  if (desuscribirRed !== null) {
    desuscribirRed();
    desuscribirRed = null;
  }
}
