import { describe, it, expect } from 'vitest';
import { estadoBuho } from './buho';

describe('estadoBuho', () => {
  it('devuelve "foco" cuando la tarea está en curso', () => {
    expect(
      estadoBuho({
        tieneTareaActiva: true,
        estadoTarea: 'en-curso',
        enLogro: false,
      })
    ).toBe('foco');
  });

  it('devuelve "reposo" cuando la tarea está pausada', () => {
    expect(
      estadoBuho({
        tieneTareaActiva: true,
        estadoTarea: 'pausada',
        enLogro: false,
      })
    ).toBe('reposo');
  });

  it('devuelve "reposo" cuando no hay tarea activa', () => {
    expect(
      estadoBuho({
        tieneTareaActiva: false,
        enLogro: false,
      })
    ).toBe('reposo');
  });

  it('devuelve "logro" durante la pantalla de logro incluso si no hay tarea activa', () => {
    expect(
      estadoBuho({
        tieneTareaActiva: false,
        enLogro: true,
      })
    ).toBe('logro');

    expect(
      estadoBuho({
        tieneTareaActiva: true,
        estadoTarea: 'en-curso',
        enLogro: true,
      })
    ).toBe('logro');
  });
});
