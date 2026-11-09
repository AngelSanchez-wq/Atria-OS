import { describe, it, expect } from 'vitest';
import {
  determinarEstadoBateria,
  calcularTiempoRestante,
  UMBRAL_BATERIA_BAJA,
  UMBRAL_BATERIA_CRITICA,
} from './bateria';

describe('determinarEstadoBateria', () => {
  it('retorna cargando o lleno cuando está conectado a la corriente', () => {
    expect(determinarEstadoBateria(50, true)).toBe('cargando');
    expect(determinarEstadoBateria(99, true)).toBe('cargando');
    expect(determinarEstadoBateria(100, true)).toBe('lleno');
  });

  it('retorna descargando cuando el nivel es superior al umbral bajo', () => {
    expect(determinarEstadoBateria(72, false)).toBe('descargando');
    expect(determinarEstadoBateria(21, false)).toBe('descargando');
  });

  it('retorna bajo cuando el nivel está entre 11 % y 20 %', () => {
    expect(determinarEstadoBateria(UMBRAL_BATERIA_BAJA, false)).toBe('bajo');
    expect(determinarEstadoBateria(15, false)).toBe('bajo');
    expect(determinarEstadoBateria(11, false)).toBe('bajo');
  });

  it('retorna critico cuando el nivel es menor o igual al 10 %', () => {
    expect(determinarEstadoBateria(UMBRAL_BATERIA_CRITICA, false)).toBe('critico');
    expect(determinarEstadoBateria(5, false)).toBe('critico');
    expect(determinarEstadoBateria(0, false)).toBe('critico');
  });
});

describe('calcularTiempoRestante', () => {
  it('formatea el tiempo de carga a partir de segundos reportados', () => {
    // 3600 s = 1 h
    expect(calcularTiempoRestante(50, true, undefined, 3600)).toBe('1 h 0 min hasta cargarse');
    // 1500 s = 25 min
    expect(calcularTiempoRestante(70, true, undefined, 1500)).toBe('25 min hasta cargarse');
    expect(calcularTiempoRestante(100, true)).toBe('Carga completa');
  });

  it('retorna "Cargando…" si no hay segundos finitos disponibles', () => {
    expect(calcularTiempoRestante(50, true, undefined, Infinity)).toBe('Cargando…');
    expect(calcularTiempoRestante(50, true)).toBe('Cargando…');
  });

  it('formatea el tiempo de descarga a partir de segundos reportados', () => {
    // 11520 s = 3 h 12 min
    expect(calcularTiempoRestante(72, false, 11520)).toBe('3 h 12 min restantes');
    // 1800 s = 30 min
    expect(calcularTiempoRestante(15, false, 1800)).toBe('30 min restantes');
  });

  it('genera una estimación coherente cuando no hay tiempo de descarga reportado (batería simulada)', () => {
    // 72 * 3 min = 216 min = 3 h 36 min
    expect(calcularTiempoRestante(72, false)).toBe('3 h 36 min restantes');
    // 10 * 3 min = 30 min
    expect(calcularTiempoRestante(10, false)).toBe('30 min restantes');
  });
});
