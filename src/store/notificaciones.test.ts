import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificaciones, seleccionarSinLeer } from './notificaciones';
import { useTareas } from './tareas';
import { Tarea } from '../kernel/types';

describe('Store de notificaciones', () => {
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

  it('recibir una notificación urgente (5) la entrega inmediatamente y emite un aviso urgente', () => {
    const notif = useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta crítica de seguridad',
    });

    const estado = useNotificaciones.getState();
    expect(notif.estado).toBe('entregada');
    expect(estado.notificaciones).toHaveLength(1);
    expect(estado.notificaciones[0].id).toBe(notif.id);
    expect(estado.avisoUrgente).toEqual(notif);
  });

  it('recibir una notificación de urgencia normal o baja la retiene y no emite aviso urgente', () => {
    const notif = useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mateo te escribió',
    });

    const estado = useNotificaciones.getState();
    expect(notif.estado).toBe('retenida');
    expect(estado.notificaciones).toHaveLength(1);
    expect(estado.avisoUrgente).toBeNull();
  });

  it('retiene notificaciones no urgentes incluso con tarea activa en curso', () => {
    const tareaMock: Tarea = {
      id: 't-demo',
      titulo: 'Escribir código',
      app: 'focuspad',
      minutos: 25,
      etiqueta: 'dev',
    };
    useTareas.getState().empezar(tareaMock);

    const notif = useNotificaciones.getState().recibir({
      tipo: 'recordatorios',
      urgencia: 4,
      titulo: 'Revisar informe',
    });

    expect(notif.estado).toBe('retenida');
    expect(useNotificaciones.getState().avisoUrgente).toBeNull();
  });

  it('descartarAvisoUrgente limpia el aviso urgente', () => {
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta inmediata',
    });

    expect(useNotificaciones.getState().avisoUrgente).not.toBeNull();

    useNotificaciones.getState().descartarAvisoUrgente();
    expect(useNotificaciones.getState().avisoUrgente).toBeNull();
  });

  it('entregarLote pasa todas las notificaciones retenidas a entregadas y programa la próxima revisión', () => {
    useNotificaciones.getState().recibir({
      tipo: 'sistema',
      urgencia: 2,
      titulo: 'Actualización disponible',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 4,
      titulo: 'Mensaje nuevo',
    });

    expect(useNotificaciones.getState().notificaciones.every((n) => n.estado === 'retenida')).toBe(true);

    useNotificaciones.getState().entregarLote();

    const estado = useNotificaciones.getState();
    expect(estado.notificaciones.every((n) => n.estado === 'entregada')).toBe(true);
    expect(estado.proximaRevision).toBeGreaterThan(Date.now());
  });

  it('marcarLeidas actualiza el estado de las notificaciones', () => {
    const n1 = useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje 1',
    });
    const n2 = useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje 2',
    });

    // Marcar solo n1
    useNotificaciones.getState().marcarLeidas([n1.id]);
    let estado = useNotificaciones.getState();
    expect(estado.notificaciones.find((n) => n.id === n1.id)?.estado).toBe('leida');
    expect(estado.notificaciones.find((n) => n.id === n2.id)?.estado).toBe('retenida');

    // Marcar todas
    useNotificaciones.getState().marcarLeidas();
    estado = useNotificaciones.getState();
    expect(estado.notificaciones.every((n) => n.estado === 'leida')).toBe(true);
  });

  it('cuenta correctamente las notificaciones sin leer', () => {
    expect(useNotificaciones.getState().contarSinLeer()).toBe(0);
    expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(0);

    const n1 = useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje',
    });
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta',
    });

    expect(useNotificaciones.getState().contarSinLeer()).toBe(2);

    useNotificaciones.getState().marcarLeidas([n1.id]);
    expect(useNotificaciones.getState().contarSinLeer()).toBe(1);
    expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(1);
  });

  it('reiniciar restablece el store por completo', () => {
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta',
    });
    useNotificaciones.getState().establecerProximaRevision(99999);

    useNotificaciones.getState().reiniciar();

    const estado = useNotificaciones.getState();
    expect(estado.notificaciones).toEqual([]);
    expect(estado.avisoUrgente).toBeNull();
    expect(estado.proximaRevision).toBeNull();
  });
});
