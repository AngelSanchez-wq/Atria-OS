/**
 * Estados de la batería en Atria-OS.
 */
export type EstadoBateria =
  | 'cargando'
  | 'descargando'
  | 'lleno'
  | 'bajo'
  | 'critico';

/** Umbrales con nombre para los niveles de batería */
export const UMBRAL_BATERIA_BAJA = 20;
export const UMBRAL_BATERIA_CRITICA = 10;
export const BATERIA_SIMULADA_NIVEL_INICIAL = 72;
export const BATERIA_SIMULADA_DESCARGA_INTERVALO_MS = 60000;

/**
 * Determina el estado cualitativo de la batería basado en su nivel porcentual y carga.
 */
export function determinarEstadoBateria(
  nivel: number,
  cargando: boolean
): EstadoBateria {
  const nivelSeguro = Math.max(0, Math.min(100, Math.round(nivel)));

  if (cargando) {
    return nivelSeguro >= 100 ? 'lleno' : 'cargando';
  }

  if (nivelSeguro >= 100) {
    return 'lleno';
  }
  if (nivelSeguro <= UMBRAL_BATERIA_CRITICA) {
    return 'critico';
  }
  if (nivelSeguro <= UMBRAL_BATERIA_BAJA) {
    return 'bajo';
  }
  return 'descargando';
}

/**
 * Calcula y formatea el tiempo restante de batería para mostrarlo en el panel.
 * Admite tiempos reales reportados en segundos por BatteryManager (si están disponibles),
 * o genera una estimación coherente en caso de batería simulada o cuando el navegador
 * omite los segundos exactos por políticas de privacidad.
 */
export function calcularTiempoRestante(
  nivel: number,
  cargando: boolean,
  tiempoDescargaSegundos?: number,
  tiempoCargaSegundos?: number
): string | null {
  const nivelSeguro = Math.max(0, Math.min(100, Math.round(nivel)));

  if (cargando) {
    if (nivelSeguro >= 100) {
      return 'Carga completa';
    }

    if (
      tiempoCargaSegundos !== undefined &&
      Number.isFinite(tiempoCargaSegundos) &&
      tiempoCargaSegundos > 0
    ) {
      const minutosTotales = Math.round(tiempoCargaSegundos / 60);
      const h = Math.floor(minutosTotales / 60);
      const m = minutosTotales % 60;
      if (h > 0) {
        return `${h} h ${m} min hasta cargarse`;
      }
      return `${Math.max(1, m)} min hasta cargarse`;
    }

    return 'Cargando…';
  }

  // Modo descargando
  if (
    tiempoDescargaSegundos !== undefined &&
    Number.isFinite(tiempoDescargaSegundos) &&
    tiempoDescargaSegundos > 0
  ) {
    const minutosTotales = Math.round(tiempoDescargaSegundos / 60);
    const h = Math.floor(minutosTotales / 60);
    const m = minutosTotales % 60;
    if (h > 0) {
      return `${h} h ${m} min restantes`;
    }
    return `${Math.max(1, m)} min restantes`;
  }

  if (nivelSeguro >= 100) {
    return '100 % disponible';
  }

  // Estimación coherente (aprox. 3 minutos por cada 1 % de carga ~ 5 h totales)
  const minutosEstimados = Math.max(1, Math.round(nivelSeguro * 3));
  const h = Math.floor(minutosEstimados / 60);
  const m = minutosEstimados % 60;

  if (h > 0) {
    return `${h} h ${m} min restantes`;
  }
  return `${m} min restantes`;
}
