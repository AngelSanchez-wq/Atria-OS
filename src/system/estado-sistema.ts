/**
 * Estado simulado del sistema (red, audio, energía).
 * TODO: conectar a la capa platform cuando exista.
 */
export type EstadoSistema = {
  wifiActivo: boolean;
  volumen: number;
  bateriaPorcentaje: number;
};

export function obtenerEstadoSistema(): EstadoSistema {
  return {
    wifiActivo: true,
    volumen: 70,
    bateriaPorcentaje: 72,
  };
}
