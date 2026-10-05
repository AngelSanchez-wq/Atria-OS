import { describe, it, expect } from 'vitest';
import { formatearTiempo } from './tiempo';

describe('tiempo', () => {
  it('formatea correctamente los segundos a MM:SS', () => {
    expect(formatearTiempo(0)).toBe('00:00');
    expect(formatearTiempo(5)).toBe('00:05');
    expect(formatearTiempo(60)).toBe('01:00');
    expect(formatearTiempo(750)).toBe('12:30');
    expect(formatearTiempo(3600)).toBe('60:00');
  });
});
