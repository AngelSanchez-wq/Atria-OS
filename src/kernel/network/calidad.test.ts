import { describe, it, expect } from 'vitest';
import {
  formatearCalidadRed,
  InformacionConexion,
} from './calidad';

describe('formatearCalidadRed', () => {
  it('retorna undefined si no se reciben detalles o están vacíos', () => {
    expect(formatearCalidadRed()).toBeUndefined();
    expect(formatearCalidadRed(null)).toBeUndefined();
    expect(formatearCalidadRed({})).toBeUndefined();
  });

  it('clasifica como Buena con 4G, downlink alto y rtt bajo', () => {
    const conexion: InformacionConexion = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    };
    const resultado = formatearCalidadRed(conexion);
    expect(resultado).toBe('Buena · aprox. 10 Mbps · 50 ms');
  });

  it('clasifica como Regular con 3G o parámetros intermedios', () => {
    const conexion: InformacionConexion = {
      effectiveType: '3g',
      downlink: 2.5,
      rtt: 180,
    };
    const resultado = formatearCalidadRed(conexion);
    expect(resultado).toBe('Regular · aprox. 3 Mbps · 180 ms');
  });

  it('clasifica como Lenta con 2G o downlink muy bajo o rtt muy alto', () => {
    const conexionLenta1: InformacionConexion = {
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 400,
    };
    expect(formatearCalidadRed(conexionLenta1)).toBe('Lenta · aprox. 0.5 Mbps · 400 ms');

    const conexionLenta2: InformacionConexion = {
      effectiveType: '4g',
      downlink: 0.8,
      rtt: 500,
    };
    expect(formatearCalidadRed(conexionLenta2)).toContain('Lenta');
  });

  it('soporta casos con información parcial (solo effectiveType o solo downlink)', () => {
    expect(formatearCalidadRed({ effectiveType: '4g' })).toBe('Buena · 4G');
    expect(formatearCalidadRed({ downlink: 15 })).toBe('Buena · aprox. 15 Mbps');
    expect(formatearCalidadRed({ rtt: 40 })).toBe('Buena · 40 ms');
  });
});
