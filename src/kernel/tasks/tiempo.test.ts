import { describe, it, expect } from 'vitest';
import { formatearTiempo, minutosEnfocados } from './tiempo';

describe('tiempo', () => {
  it('formatea correctamente los segundos a MM:SS', () => {
    expect(formatearTiempo(0)).toBe('00:00');
    expect(formatearTiempo(5)).toBe('00:05');
    expect(formatearTiempo(60)).toBe('01:00');
    expect(formatearTiempo(750)).toBe('12:30');
    expect(formatearTiempo(3600)).toBe('60:00');
  });

  describe('minutosEnfocados', () => {
    it('muestra como mínimo 1 min para 0 o pocos segundos transcurridos', () => {
      expect(minutosEnfocados(0)).toBe(1);
      expect(minutosEnfocados(45)).toBe(1);
      expect(minutosEnfocados(59)).toBe(1);
    });

    it('redondea hacia abajo cuando supera el minuto', () => {
      expect(minutosEnfocados(60)).toBe(1);
      expect(minutosEnfocados(119)).toBe(1);
      expect(minutosEnfocados(120)).toBe(2);
      expect(minutosEnfocados(900)).toBe(15);
      expect(minutosEnfocados(950)).toBe(15);
    });
  });
});

