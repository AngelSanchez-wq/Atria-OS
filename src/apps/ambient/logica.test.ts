import { describe, it, expect } from 'vitest';
import { alternarSonido } from './logica';

describe('alternarSonido', () => {
  it('activa el sonido pulsado si no había ninguno activo', () => {
    expect(alternarSonido(null, 'lluvia')).toBe('lluvia');
  });

  it('cambia al nuevo sonido si se pulsa uno diferente', () => {
    expect(alternarSonido('lluvia', 'bosque')).toBe('bosque');
    expect(alternarSonido('bosque', 'noche')).toBe('noche');
  });

  it('detiene el sonido (retorna null) si se pulsa el mismo que está activo', () => {
    expect(alternarSonido('lluvia', 'lluvia')).toBeNull();
    expect(alternarSonido('noche', 'noche')).toBeNull();
  });
});
