import { describe, it, expect } from 'vitest';
import { ordenarSugerencias, siguienteSugerencia } from './sugerencias';
import { Tarea } from '../types';

function tarea(id: string, creadaEn: number, importante = false): Tarea {
  return { id, titulo: `Tarea ${id}`, app: 'focuspad', minutos: 10, etiqueta: 'x', creadaEn, importante };
}

describe('ordenarSugerencias', () => {
  it('pone primero las importantes y luego por antigüedad', () => {
    const lista = [tarea('a', 30), tarea('b', 10), tarea('c', 50, true), tarea('d', 20, true)];
    expect(ordenarSugerencias(lista).map((t) => t.id)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('no modifica el arreglo original y conserva el orden si empatan', () => {
    const lista = [tarea('a', 0), tarea('b', 0)];
    const copia = [...lista];
    expect(ordenarSugerencias(lista).map((t) => t.id)).toEqual(['a', 'b']);
    expect(lista).toEqual(copia);
  });
});

describe('siguienteSugerencia', () => {
  it('con lista vacía devuelve null', () => {
    expect(siguienteSugerencia([], null)).toEqual({ tarea: null, esImportante: false });
    expect(siguienteSugerencia([], 'x')).toEqual({ tarea: null, esImportante: false });
  });

  it('con una sola tarea devuelve siempre la misma', () => {
    const lista = [tarea('a', 1)];
    expect(siguienteSugerencia(lista, null).tarea?.id).toBe('a');
    expect(siguienteSugerencia(lista, 'a').tarea?.id).toBe('a');
  });

  it('rota de forma circular entre las no importantes por antigüedad', () => {
    const lista = [tarea('c', 3), tarea('a', 1), tarea('b', 2)];
    expect(siguienteSugerencia(lista, null).tarea?.id).toBe('a');
    expect(siguienteSugerencia(lista, 'a').tarea?.id).toBe('b');
    expect(siguienteSugerencia(lista, 'b').tarea?.id).toBe('c');
    expect(siguienteSugerencia(lista, 'c').tarea?.id).toBe('a');
    expect(siguienteSugerencia(lista, 'c').esImportante).toBe(false);
  });

  it('si la actual es la única importante no se salta', () => {
    const lista = [tarea('a', 1), tarea('imp', 5, true), tarea('b', 2)];
    expect(siguienteSugerencia(lista, 'imp')).toEqual({ tarea: lista[1], esImportante: true });
  });

  it('en una mezcla, la sugerencia siempre es la importante', () => {
    const lista = [tarea('a', 1), tarea('imp', 5, true), tarea('b', 2)];
    expect(siguienteSugerencia(lista, null).tarea?.id).toBe('imp');
    expect(siguienteSugerencia(lista, 'a').tarea?.id).toBe('imp');
    expect(siguienteSugerencia(lista, 'a').esImportante).toBe(true);
  });

  it('con varias importantes se recorren solo entre ellas', () => {
    const lista = [tarea('a', 1), tarea('i1', 4, true), tarea('b', 2), tarea('i2', 3, true)];
    expect(siguienteSugerencia(lista, 'i2')).toEqual({ tarea: lista[1], esImportante: true });
    expect(siguienteSugerencia(lista, 'i1')).toEqual({ tarea: lista[3], esImportante: true });
  });
});
