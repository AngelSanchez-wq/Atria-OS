import { describe, it, expect, beforeEach } from 'vitest';
import { useTareas } from './tareas';
import { Tarea } from '../kernel/types';

describe('Store Tareas', () => {
  const tareaMock = { id: '1', minutos: 10 } as Tarea;
  const tareaSiguiente = { id: '2', minutos: 5 } as Tarea;

  beforeEach(() => {
    useTareas.setState({
      tareaActiva: null,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: [],
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
    });
  });

  it('empezar setea la tarea y resetea contadores', () => {
    const store = useTareas.getState();
    store.empezar(tareaMock, [tareaSiguiente]);
    const estadoActual = useTareas.getState();
    expect(estadoActual.tareaActiva).toEqual(tareaMock);
    expect(estadoActual.pendientes).toEqual([tareaSiguiente]);
    expect(estadoActual.segundosTranscurridos).toBe(0);
    expect(estadoActual.estado).toBe('en-curso');
  });

  it('pausar y reanudar cambian el estado', () => {
    useTareas.getState().empezar(tareaMock);
    
    useTareas.getState().pausar();
    expect(useTareas.getState().estado).toBe('pausada');

    useTareas.getState().reanudar();
    expect(useTareas.getState().estado).toBe('en-curso');
  });

  it('avanzar suma tiempo si está en curso y no pasa del límite', () => {
    useTareas.getState().empezar(tareaMock); // 10 min = 600 seg
    
    useTareas.getState().avanzar(10);
    expect(useTareas.getState().segundosTranscurridos).toBe(10);

    useTareas.getState().avanzar(1000);
    expect(useTareas.getState().segundosTranscurridos).toBe(600); // Límite 600
  });

  it('avanzar no suma si está en pausa', () => {
    useTareas.getState().empezar(tareaMock);
    useTareas.getState().pausar();
    useTareas.getState().avanzar(10);
    expect(useTareas.getState().segundosTranscurridos).toBe(0);
  });

  it('terminar activa el estado de logro y guarda la última tarea terminada', () => {
    useTareas.getState().empezar(tareaMock, [tareaSiguiente]);
    useTareas.getState().avanzar(120);

    useTareas.getState().terminar();

    const estado = useTareas.getState();
    expect(estado.enLogro).toBe(true);
    expect(estado.tareaActiva).toBeNull();
    expect(estado.ultimaTerminada).toEqual({
      tarea: tareaMock,
      segundosTranscurridos: 120,
    });
    expect(estado.pendientes).toEqual([tareaSiguiente]);
  });

  it('continuarTrasLogro desactiva el logro y activa la siguiente tarea', () => {
    useTareas.getState().empezar(tareaMock, [tareaSiguiente]);
    useTareas.getState().terminar();
    useTareas.getState().continuarTrasLogro();

    const estado = useTareas.getState();
    expect(estado.enLogro).toBe(false);
    expect(estado.ultimaTerminada).toBeNull();
    expect(estado.tareaActiva).toEqual(tareaSiguiente);
    expect(estado.pendientes).toEqual([]);
    expect(estado.segundosTranscurridos).toBe(0);
  });
});
