import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from 'react';
import {
  useNotificaciones,
  seleccionarSinLeer,
  seleccionarEstadoRevision,
  seleccionarColaRevision,
  seleccionarNotificacionActual,
  seleccionarSegmentosRevision,
  seleccionarProgresoRevision,
} from './notificaciones';
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
    expect(estado.enRevision).toBe(false);
    expect(estado.idActualRevision).toBeNull();
    expect(estado.idsPospuestasRevision).toEqual([]);
    expect(estado.colaRevisionIds).toEqual([]);
  });

  describe('Revisión una por una', () => {
    it('iniciarRevision entrega las notificaciones retenidas y coloca las urgentes primero en la cola', () => {
      let nNormalId = '';
      let nUrgenteId = '';
      let nBajaId = '';

      act(() => {
        const nNormal = useNotificaciones.getState().recibir({
          tipo: 'mensajes',
          urgencia: 3,
          titulo: 'Normal 1',
        });
        nNormalId = nNormal.id;

        const nUrgente = useNotificaciones.getState().recibir({
          tipo: 'alertas',
          urgencia: 5,
          titulo: 'Urgente 1',
        });
        nUrgenteId = nUrgente.id;

        const nBaja = useNotificaciones.getState().recibir({
          tipo: 'recordatorios',
          urgencia: 1,
          titulo: 'Baja 1',
        });
        nBajaId = nBaja.id;
      });

      act(() => {
        useNotificaciones.getState().iniciarRevision();
      });

      const estado = useNotificaciones.getState();
      expect(estado.enRevision).toBe(true);
      expect(estado.notificaciones.every((n) => n.estado === 'entregada')).toBe(true);

      // Cola ordenada: la urgente debe ir primero
      expect(estado.colaRevisionIds).toEqual([nUrgenteId, nNormalId, nBajaId]);
      expect(estado.idActualRevision).toBe(nUrgenteId);
      expect(seleccionarEstadoRevision(estado)).toBe('en-curso');
      expect(seleccionarNotificacionActual(estado)?.id).toBe(nUrgenteId);

      const progreso = seleccionarProgresoRevision(estado);
      expect(progreso).toEqual({ revisadas: 0, total: 3 });
      expect(seleccionarColaRevision(estado).map((n) => n.id)).toEqual([
        nUrgenteId,
        nNormalId,
        nBajaId,
      ]);
    });

    it('iniciarRevision con lista vacía pasa a terminada directamente', () => {
      act(() => {
        useNotificaciones.getState().iniciarRevision();
      });

      const estado = useNotificaciones.getState();
      expect(estado.enRevision).toBe(true);
      expect(estado.idActualRevision).toBeNull();
      expect(seleccionarEstadoRevision(estado)).toBe('terminada');
    });

    it('entendido marca la notificación como leída y avanza a la siguiente', () => {
      let n1Id = '';
      let n2Id = '';

      act(() => {
        const n1 = useNotificaciones.getState().recibir({
          tipo: 'mensajes',
          urgencia: 3,
          titulo: 'Mensaje 1',
        });
        n1Id = n1.id;
        const n2 = useNotificaciones.getState().recibir({
          tipo: 'recordatorios',
          urgencia: 3,
          titulo: 'Recordatorio 2',
        });
        n2Id = n2.id;
        useNotificaciones.getState().iniciarRevision();
      });

      expect(useNotificaciones.getState().idActualRevision).toBe(n1Id);

      // Usuario presiona "Entendido" en la primera tarjeta
      act(() => {
        useNotificaciones.getState().entendido();
      });

      let estado = useNotificaciones.getState();
      expect(estado.notificaciones.find((n) => n.id === n1Id)?.estado).toBe('leida');
      expect(estado.idActualRevision).toBe(n2Id);
      expect(seleccionarEstadoRevision(estado)).toBe('en-curso');
      expect(seleccionarProgresoRevision(estado)).toEqual({ revisadas: 1, total: 2 });

      // Usuario presiona "Entendido" en la segunda (última) tarjeta
      act(() => {
        useNotificaciones.getState().entendido();
      });

      estado = useNotificaciones.getState();
      expect(estado.notificaciones.find((n) => n.id === n2Id)?.estado).toBe('leida');
      expect(estado.idActualRevision).toBeNull();
      expect(seleccionarEstadoRevision(estado)).toBe('terminada');
      expect(seleccionarProgresoRevision(estado)).toEqual({ revisadas: 2, total: 2 });
    });

    it('masTarde pospone la notificación actual mandándola al final sin marcarla leída', () => {
      let n1Id = '';
      let n2Id = '';
      let n3Id = '';

      act(() => {
        n1Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' }).id;
        n2Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '2' }).id;
        n3Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '3' }).id;
        useNotificaciones.getState().iniciarRevision();
      });

      expect(useNotificaciones.getState().colaRevisionIds).toEqual([n1Id, n2Id, n3Id]);

      // Pospone n1
      act(() => {
        useNotificaciones.getState().masTarde();
      });

      const estado = useNotificaciones.getState();
      // n1 fue mandada al final
      expect(estado.colaRevisionIds).toEqual([n2Id, n3Id, n1Id]);
      expect(estado.idsPospuestasRevision).toEqual([n1Id]);
      // n1 sigue entregada, no leída
      expect(estado.notificaciones.find((n) => n.id === n1Id)?.estado).toBe('entregada');
      // Avanzó a n2
      expect(estado.idActualRevision).toBe(n2Id);
    });

    it('termina con pendientes cuando se pospusieron elementos y se revisa el resto', () => {
      act(() => {
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' });
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '2' });
        useNotificaciones.getState().iniciarRevision();
      });

      // Pospone la primera -> avanza a la segunda
      act(() => {
        useNotificaciones.getState().masTarde();
      });

      // Entendido en la segunda -> termina la primera pasada
      act(() => {
        useNotificaciones.getState().entendido();
      });

      const estado = useNotificaciones.getState();
      expect(estado.idActualRevision).toBeNull();
      expect(seleccionarEstadoRevision(estado)).toBe('terminada-con-pendientes');
    });

    it('seguirConPospuestas reanuda la revisión con las notificaciones pospuestas', () => {
      let n1Id = '';

      act(() => {
        n1Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' }).id;
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '2' });
        useNotificaciones.getState().iniciarRevision();
      });

      act(() => {
        useNotificaciones.getState().masTarde(); // n1 pospuesta
        useNotificaciones.getState().entendido(); // n2 leída
      });

      expect(seleccionarEstadoRevision(useNotificaciones.getState())).toBe('terminada-con-pendientes');

      // Reanudar con pospuestas
      act(() => {
        useNotificaciones.getState().seguirConPospuestas();
      });

      let estado = useNotificaciones.getState();
      expect(estado.idActualRevision).toBe(n1Id);
      expect(seleccionarEstadoRevision(estado)).toBe('en-curso');

      // Leer la pospuesta
      act(() => {
        useNotificaciones.getState().entendido();
      });

      estado = useNotificaciones.getState();
      expect(estado.idActualRevision).toBeNull();
      expect(seleccionarEstadoRevision(estado)).toBe('terminada');
    });

    it('si llega una notificación urgente durante la revisión, entra a la cola sin cortar la tarjeta actual', () => {
      let n1Id = '';
      let n2Id = '';

      act(() => {
        n1Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: 'Normal 1' }).id;
        n2Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: 'Normal 2' }).id;
        useNotificaciones.getState().iniciarRevision();
      });

      // El usuario está viendo la tarjeta n1
      expect(useNotificaciones.getState().idActualRevision).toBe(n1Id);

      // Llega una notificación urgente (5) en plena revisión
      let nUrgenteId = '';
      act(() => {
        const nUrgente = useNotificaciones.getState().recibir({
          tipo: 'alertas',
          urgencia: 5,
          titulo: 'Alerta urgente en vivo',
        });
        nUrgenteId = nUrgente.id;
      });

      const estado = useNotificaciones.getState();
      // NO debe cortar la tarjeta actual que el usuario está leyendo
      expect(estado.idActualRevision).toBe(n1Id);
      // Emite aviso urgente
      expect(estado.avisoUrgente?.id).toBe(nUrgenteId);
      // Se inserta justo después de la actual
      expect(estado.colaRevisionIds).toEqual([n1Id, nUrgenteId, n2Id]);

      // Al marcar n1 como entendido, la siguiente es la urgente recién llegada
      act(() => {
        useNotificaciones.getState().entendido();
      });

      expect(useNotificaciones.getState().idActualRevision).toBe(nUrgenteId);
    });

    it('el contador de la campana conserva las notificaciones pospuestas como no leídas', () => {
      act(() => {
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' });
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '2' });
      });

      expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(2);

      act(() => {
        useNotificaciones.getState().iniciarRevision();
        useNotificaciones.getState().masTarde(); // primera pospuesta
      });

      // Pospuesta sigue sin leer, entregada sin leer -> contador = 2
      expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(2);

      // Marcamos la segunda como leída
      act(() => {
        useNotificaciones.getState().entendido();
      });

      // Solo queda la pospuesta sin leer -> contador = 1
      expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(1);

      // Ahora la leemos
      act(() => {
        useNotificaciones.getState().seguirConPospuestas();
        useNotificaciones.getState().entendido();
      });

      expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(0);
    });

    it('cerrarRevision restablece el estado de la revisión a inactiva', () => {
      act(() => {
        useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' });
        useNotificaciones.getState().iniciarRevision();
      });

      expect(useNotificaciones.getState().enRevision).toBe(true);
      expect(seleccionarEstadoRevision(useNotificaciones.getState())).toBe('en-curso');

      act(() => {
        useNotificaciones.getState().cerrarRevision();
      });

      const estado = useNotificaciones.getState();
      expect(estado.enRevision).toBe(false);
      expect(estado.idActualRevision).toBeNull();
      expect(estado.idsPospuestasRevision).toEqual([]);
      expect(estado.colaRevisionIds).toEqual([]);
      expect(seleccionarEstadoRevision(estado)).toBe('inactiva');
    });

    it('seleccionarSegmentosRevision calcula correctamente los segmentos visuales', () => {
      let n1Id = '';
      let n2Id = '';
      let n3Id = '';

      act(() => {
        n1Id = useNotificaciones.getState().recibir({ tipo: 'mensajes', urgencia: 3, titulo: '1' }).id;
        n2Id = useNotificaciones.getState().recibir({ tipo: 'alertas', urgencia: 5, titulo: 'Urgente' }).id;
        n3Id = useNotificaciones.getState().recibir({ tipo: 'sistema', urgencia: 2, titulo: '3' }).id;
        useNotificaciones.getState().iniciarRevision();
      });

      // Cola inicial: [n2 (urgente), n1 (normal), n3 (baja)]
      // Actual es n2
      let segmentos = seleccionarSegmentosRevision(useNotificaciones.getState());
      expect(segmentos).toEqual([
        { id: n2Id, estado: 'actual' },
        { id: n1Id, estado: 'pendiente' },
        { id: n3Id, estado: 'pendiente' },
      ]);

      // Usuario lee n2 -> actual pasa a n1
      act(() => {
        useNotificaciones.getState().entendido();
      });

      segmentos = seleccionarSegmentosRevision(useNotificaciones.getState());
      expect(segmentos).toEqual([
        { id: n2Id, estado: 'revisada' },
        { id: n1Id, estado: 'actual' },
        { id: n3Id, estado: 'pendiente' },
      ]);

      // Usuario pospone n1 -> se mueve al final, actual pasa a n3
      act(() => {
        useNotificaciones.getState().masTarde();
      });

      segmentos = seleccionarSegmentosRevision(useNotificaciones.getState());
      expect(segmentos).toEqual([
        { id: n2Id, estado: 'revisada' },
        { id: n3Id, estado: 'actual' },
        { id: n1Id, estado: 'pospuesta' },
      ]);
    });
  });
});
