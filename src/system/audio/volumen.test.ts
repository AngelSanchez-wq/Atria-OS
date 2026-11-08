import { describe, it, expect } from 'vitest';
import { calcularVolumenEfectivo } from './volumen';

describe('calcularVolumenEfectivo', () => {
  it('devuelve 0 cuando está silenciado independientemente de los niveles', () => {
    expect(calcularVolumenEfectivo(1, 1, true)).toBe(0);
    expect(calcularVolumenEfectivo(0.5, 0.7, true)).toBe(0);
    expect(calcularVolumenEfectivo(0.8, 0, true)).toBe(0);
  });

  it('calcula el producto del volumen propio por el volumen maestro cuando no está silenciado', () => {
    // 0.5 propio × 0.7 maestro = 0.35
    expect(calcularVolumenEfectivo(0.5, 0.7, false)).toBe(0.35);

    // 1.0 propio × 1.0 maestro = 1.0
    expect(calcularVolumenEfectivo(1, 1, false)).toBe(1);

    // 0.8 propio × 0.5 maestro = 0.4
    expect(calcularVolumenEfectivo(0.8, 0.5, false)).toBe(0.4);

    // 0 propio × 1.0 maestro = 0
    expect(calcularVolumenEfectivo(0, 1, false)).toBe(0);

    // 1.0 propio × 0 maestro = 0
    expect(calcularVolumenEfectivo(1, 0, false)).toBe(0);
  });

  it('acota los valores que se salgan del rango 0 a 1', () => {
    // Valores superiores a 1
    expect(calcularVolumenEfectivo(1.5, 1, false)).toBe(1);
    expect(calcularVolumenEfectivo(0.5, 2.0, false)).toBe(0.5);

    // Valores inferiores a 0
    expect(calcularVolumenEfectivo(-0.5, 0.7, false)).toBe(0);
    expect(calcularVolumenEfectivo(0.5, -0.2, false)).toBe(0);
  });
});
