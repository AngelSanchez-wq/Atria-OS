import { describe, it, expect } from 'vitest';
import { calcularPorcentaje, obtenerColorProgreso } from './progreso';

describe('progreso', () => {
  it('calcula correctamente el porcentaje limitando entre 0 y 100', () => {
    expect(calcularPorcentaje(0, 10)).toBe(0);
    expect(calcularPorcentaje(300, 10)).toBe(50);
    expect(calcularPorcentaje(600, 10)).toBe(100);
    expect(calcularPorcentaje(1200, 10)).toBe(100); // excedido
    expect(calcularPorcentaje(-10, 10)).toBe(0); // negativo
  });

  it('asigna el color acento hasta el 80% y luego cálido', () => {
    expect(obtenerColorProgreso(0)).toBe('acento');
    expect(obtenerColorProgreso(79.9)).toBe('acento');
    expect(obtenerColorProgreso(80)).toBe('calido');
    expect(obtenerColorProgreso(100)).toBe('calido');
  });
});
