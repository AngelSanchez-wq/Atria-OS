import { describe, it, expect } from 'vitest';
import { terminarTarea } from './transiciones';
import { Tarea } from '../types';

describe('transiciones', () => {
  it('toma la primera pendiente como activa y devuelve el resto', () => {
    const pendientes = [{ id: '1' }, { id: '2' }, { id: '3' }] as Tarea[];
    const res = terminarTarea(pendientes);
    expect(res.siguienteActiva).toEqual({ id: '1' });
    expect(res.nuevasPendientes).toEqual([{ id: '2' }, { id: '3' }]);
  });

  it('devuelve null si no hay pendientes', () => {
    const res = terminarTarea([]);
    expect(res.siguienteActiva).toBeNull();
    expect(res.nuevasPendientes).toEqual([]);
  });
});
