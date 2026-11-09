export type InformacionConexion = {
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // ms
};

/** Umbrales con nombre para determinar la calidad de la conexión */
export const RTT_BUENA_MAX_MS = 100;
export const RTT_REGULAR_MAX_MS = 300;
export const DOWNLINK_BUENA_MIN_MBPS = 5;
export const DOWNLINK_REGULAR_MIN_MBPS = 1.5;

/**
 * Convierte los parámetros de NetworkInformation (effectiveType, downlink, rtt)
 * en un texto descriptivo accesible: "Buena", "Regular" o "Lenta", con valores aproximados.
 *
 * Ejemplo de salida: "Buena · aprox. 10 Mbps · 50 ms"
 */
export function formatearCalidadRed(
  detalles?: InformacionConexion | null
): string | undefined {
  if (!detalles) return undefined;

  const { effectiveType, downlink, rtt } = detalles;
  const tieneDatos =
    effectiveType !== undefined || downlink !== undefined || rtt !== undefined;

  if (!tieneDatos) return undefined;

  // Clasificación de calidad
  let nivel: 'Buena' | 'Regular' | 'Lenta';

  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    (downlink !== undefined && downlink < DOWNLINK_REGULAR_MIN_MBPS) ||
    (rtt !== undefined && rtt > RTT_REGULAR_MAX_MS)
  ) {
    nivel = 'Lenta';
  } else if (
    (downlink !== undefined && downlink >= DOWNLINK_BUENA_MIN_MBPS) ||
    (rtt !== undefined && rtt <= RTT_BUENA_MAX_MS) ||
    effectiveType === '4g'
  ) {
    nivel = 'Buena';
  } else {
    nivel = 'Regular';
  }

  const partes: string[] = [nivel];

  if (downlink !== undefined && downlink > 0) {
    // Redondear o mostrar 1 decimal si es menor a 1
    const dlTexto =
      downlink >= 1
        ? `${Math.round(downlink)} Mbps`
        : `${downlink.toFixed(1)} Mbps`;
    partes.push(`aprox. ${dlTexto}`);
  }

  if (rtt !== undefined && rtt > 0) {
    partes.push(`${Math.round(rtt)} ms`);
  }

  if (partes.length === 1 && effectiveType) {
    partes.push(effectiveType.toUpperCase());
  }

  return partes.join(' · ');
}
