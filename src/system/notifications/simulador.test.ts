import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { iniciarSimuladorNotificaciones } from './simulador';
import { useNotificaciones } from '../../store/notificaciones';
import { useTareas } from '../../store/tareas';

describe('Simulador de notificaciones', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNotificaciones.getState().reiniciar();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emite notificaciones a intervalos regulares respetando el máximo configurado', () => {
    const detener = iniciarSimuladorNotificaciones({
      intervaloSimuladorMs: 1000,
      intervaloRevisionMs: 60000,
      maximoSimuladas: 3,
    });

    expect(useNotificaciones.getState().notificaciones).toHaveLength(0);

    // 1 segundo: llega 1ª notificación
    vi.advanceTimersByTime(1000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);

    // 2 segundos: llega 2ª notificación
    vi.advanceTimersByTime(1000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(2);

    // 3 segundos: llega 3ª notificación (máximo alcanzado)
    vi.advanceTimersByTime(1000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(3);

    // 5 segundos más: no debe superar el máximo
    vi.advanceTimersByTime(5000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(3);

    detener();
  });

  it('ejecuta la revisión periódica y entrega el lote en el tiempo programado', () => {
    const detener = iniciarSimuladorNotificaciones({
      intervaloSimuladorMs: 1000,
      intervaloRevisionMs: 5000,
      maximoSimuladas: 4,
    });

    // Avanzamos 3 segundos: llegan 3 notificaciones no urgentes
    vi.advanceTimersByTime(3000);
    const antesRevision = useNotificaciones.getState().notificaciones;
    expect(antesRevision.length).toBeGreaterThan(0);
    const retenidasAntes = antesRevision.filter((n) => n.estado === 'retenida');
    expect(retenidasAntes.length).toBeGreaterThan(0);

    // Avanzamos hasta los 5000 ms (tiempo de revisión)
    vi.advanceTimersByTime(2000);

    const despuesRevision = useNotificaciones.getState().notificaciones;
    const retenidasDespues = despuesRevision.filter((n) => n.estado === 'retenida');
    expect(retenidasDespues).toHaveLength(0);
    expect(despuesRevision.every((n) => n.estado === 'entregada')).toBe(true);

    detener();
  });

  it('detener limpia los temporizadores y no genera más notificaciones ni revisiones', () => {
    const detener = iniciarSimuladorNotificaciones({
      intervaloSimuladorMs: 1000,
      intervaloRevisionMs: 5000,
      maximoSimuladas: 10,
    });

    vi.advanceTimersByTime(2000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(2);

    // Se detiene el simulador
    detener();

    // Avanzar más tiempo: no debe emitir ninguna notificación adicional
    vi.advanceTimersByTime(10000);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(2);
  });
});
