import { describe, it, expect } from 'vitest';
import { terminarTarea, iniciarLogro, continuarLogro } from './transiciones';
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

  it('iniciarLogro registra la tarea terminada y activa el estado de logro', () => {
    const tarea = { id: 't1', titulo: 'Tarea 1' } as Tarea;
    const res = iniciarLogro(tarea, 900);

    expect(res.enLogro).toBe(true);
    expect(res.tareaActiva).toBeNull();
    expect(res.ultimaTerminada).toEqual({
      tarea,
      segundosTranscurridos: 900,
    });
  });

  it('continuarLogro finaliza el logro y activa la siguiente tarea pendiente', () => {
    const pendientes = [{ id: 't2' }] as Tarea[];
    const res = continuarLogro(pendientes);

    expect(res.enLogro).toBe(false);
    expect(res.ultimaTerminada).toBeNull();
    expect(res.siguienteActiva).toEqual({ id: 't2' });
    expect(res.nuevasPendientes).toEqual([]);
    expect(res.segundosTranscurridos).toBe(0);
    expect(res.estado).toBe('en-curso');
  });
});
