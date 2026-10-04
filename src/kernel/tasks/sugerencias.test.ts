import { describe, it, expect } from 'vitest';
import { siguienteSugerencia } from './sugerencias';
import { Tarea } from '../types';

describe('siguienteSugerencia', () => {
  const tareasPrueba = [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ] as Tarea[];

  it('avanza al siguiente índice de forma circular', () => {
    expect(siguienteSugerencia(tareasPrueba, 0)).toBe(1);
    expect(siguienteSugerencia(tareasPrueba, 1)).toBe(2);
    expect(siguienteSugerencia(tareasPrueba, 2)).toBe(0);
  });

  it('retorna 0 si el arreglo está vacío', () => {
    expect(siguienteSugerencia([], 0)).toBe(0);
  });
});
