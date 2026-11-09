import { describe, it, expect } from 'vitest';
import { formatearTiempoSimulado } from './formato';

describe('formatearTiempoSimulado', () => {
  it('formatea 0 ticks como 00:00', () => {
    expect(formatearTiempoSimulado(0)).toBe('00:00');
  });

  it('formatea segundos menores a un minuto con ceros a la izquierda', () => {
    expect(formatearTiempoSimulado(5)).toBe('00:05');
    expect(formatearTiempoSimulado(59)).toBe('00:59');
  });

  it('formatea un minuto exacto como 01:00', () => {
    expect(formatearTiempoSimulado(60)).toBe('01:00');
  });

  it('formatea 155 ticks exactamente como 02:35 (mockup)', () => {
    expect(formatearTiempoSimulado(155)).toBe('02:35');
  });

  it('soporta tiempos largos mayores a una hora sin romper el formato mm:ss', () => {
    expect(formatearTiempoSimulado(3600)).toBe('60:00');
    expect(formatearTiempoSimulado(3665)).toBe('61:05');
  });

  it('maneja valores defensivos como negativos, decimales o NaN', () => {
    expect(formatearTiempoSimulado(-10)).toBe('00:00');
    expect(formatearTiempoSimulado(12.7)).toBe('00:12');
    expect(formatearTiempoSimulado(Number.NaN)).toBe('00:00');
  });
});
