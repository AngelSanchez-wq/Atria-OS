import { describe, it, expect } from 'vitest';
import {
  nivelDeUrgencia,
  decidirEntrega,
  agruparPorNivel,
  contarPorTipo,
  entregarLote,
  marcarLeidas,
  marcarLeida,
  posponer,
  colaDeRevision,
  siguientePendiente,
  progresoRevision,
  quedanPospuestas,
  segmentosRevision,
  contarSinLeer,
  proximaRevision,
} from './reglas';
import { Notificacion } from '../types';

describe('reglas de interrupción y notificaciones', () => {
  describe('nivelDeUrgencia', () => {
    it('clasifica urgencia 5 como urgente', () => {
      expect(nivelDeUrgencia(5)).toBe('urgente');
    });

    it('clasifica valores mayores a 5 como urgente', () => {
      expect(nivelDeUrgencia(6)).toBe('urgente');
    });

    it('clasifica urgencias 3 y 4 como normal', () => {
      expect(nivelDeUrgencia(3)).toBe('normal');
      expect(nivelDeUrgencia(4)).toBe('normal');
    });

    it('clasifica urgencias 1 y 2 como baja', () => {
      expect(nivelDeUrgencia(1)).toBe('baja');
      expect(nivelDeUrgencia(2)).toBe('baja');
    });

    it('clasifica valores menores a 1 como baja', () => {
      expect(nivelDeUrgencia(0)).toBe('baja');
      expect(nivelDeUrgencia(-1)).toBe('baja');
    });
  });

  describe('decidirEntrega', () => {
    it('entrega inmediatamente la urgencia 5 sin tarea en curso', () => {
      expect(decidirEntrega({ urgencia: 5 }, { hayTareaEnCurso: false })).toBe('inmediata');
    });

    it('entrega inmediatamente la urgencia 5 incluso con tarea en curso', () => {
      expect(decidirEntrega({ urgencia: 5 }, { hayTareaEnCurso: true })).toBe('inmediata');
    });

    it('retiene urgencias 1 a 4 sin tarea en curso', () => {
      for (let u = 1; u <= 4; u++) {
        expect(decidirEntrega({ urgencia: u }, { hayTareaEnCurso: false })).toBe('retener');
      }
    });

    it('retiene urgencias 1 a 4 con tarea en curso', () => {
      for (let u = 1; u <= 4; u++) {
        expect(decidirEntrega({ urgencia: u }, { hayTareaEnCurso: true })).toBe('retener');
      }
    });
  });

  describe('agruparPorNivel', () => {
    it('retorna grupos vacíos para una lista vacía', () => {
      expect(agruparPorNivel([])).toEqual({
        urgente: [],
        normal: [],
        baja: [],
      });
    });

    it('agrupa correctamente notificaciones según su urgencia', () => {
      const n1: Notificacion = {
        id: '1',
        tipo: 'alertas',
        urgencia: 5,
        titulo: 'Alerta urgente',
        creadaEn: 1000,
        estado: 'entregada',
      };
      const n2: Notificacion = {
        id: '2',
        tipo: 'mensajes',
        urgencia: 4,
        titulo: 'Mensaje normal',
        creadaEn: 1001,
        estado: 'retenida',
      };
      const n3: Notificacion = {
        id: '3',
        tipo: 'recordatorios',
        urgencia: 2,
        titulo: 'Recordatorio bajo',
        creadaEn: 1002,
        estado: 'retenida',
      };

      const resultado = agruparPorNivel([n1, n2, n3]);
      expect(resultado.urgente).toEqual([n1]);
      expect(resultado.normal).toEqual([n2]);
      expect(resultado.baja).toEqual([n3]);
    });
  });

  describe('contarPorTipo', () => {
    it('retorna ceros para una lista vacía', () => {
      expect(contarPorTipo([])).toEqual({
        sistema: 0,
        mensajes: 0,
        recordatorios: 0,
        alertas: 0,
      });
    });

    it('cuenta con precisión cada tipo de notificación', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'sistema', urgencia: 2, titulo: 'A', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'mensajes', urgencia: 3, titulo: 'B', creadaEn: 2, estado: 'retenida' },
        { id: '3', tipo: 'mensajes', urgencia: 4, titulo: 'C', creadaEn: 3, estado: 'retenida' },
        { id: '4', tipo: 'alertas', urgencia: 5, titulo: 'D', creadaEn: 4, estado: 'entregada' },
      ];

      expect(contarPorTipo(lista)).toEqual({
        sistema: 1,
        mensajes: 2,
        recordatorios: 0,
        alertas: 1,
      });
    });
  });

  describe('entregarLote', () => {
    it('convierte retenidas en entregadas y no modifica las demás', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'M', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'alertas', urgencia: 5, titulo: 'A', creadaEn: 2, estado: 'entregada' },
        { id: '3', tipo: 'sistema', urgencia: 2, titulo: 'S', creadaEn: 3, estado: 'leida' },
      ];

      const resultado = entregarLote(lista);
      expect(resultado[0].estado).toBe('entregada');
      expect(resultado[1].estado).toBe('entregada');
      expect(resultado[2].estado).toBe('leida');
    });

    it('retorna lista vacía si recibe lista vacía', () => {
      expect(entregarLote([])).toEqual([]);
    });
  });

  describe('marcarLeidas', () => {
    it('marca todas las notificaciones como leídas cuando no se pasan IDs', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'M', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'alertas', urgencia: 5, titulo: 'A', creadaEn: 2, estado: 'entregada' },
      ];

      const resultado = marcarLeidas(lista);
      expect(resultado.every((n) => n.estado === 'leida')).toBe(true);
    });

    it('marca únicamente los IDs indicados', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'M', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'alertas', urgencia: 5, titulo: 'A', creadaEn: 2, estado: 'entregada' },
      ];

      const resultado = marcarLeidas(lista, ['1']);
      expect(resultado[0].estado).toBe('leida');
      expect(resultado[1].estado).toBe('entregada');
    });

    it('soporta listas vacías', () => {
      expect(marcarLeidas([])).toEqual([]);
      expect(marcarLeidas([], ['1'])).toEqual([]);
    });
  });

  describe('contarSinLeer', () => {
    it('devuelve 0 para lista vacía', () => {
      expect(contarSinLeer([])).toBe(0);
    });

    it('suma retenidas y entregadas que no han sido leídas', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'M', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'alertas', urgencia: 5, titulo: 'A', creadaEn: 2, estado: 'entregada' },
        { id: '3', tipo: 'sistema', urgencia: 2, titulo: 'S', creadaEn: 3, estado: 'leida' },
      ];

      expect(contarSinLeer(lista)).toBe(2);
    });
  });

  describe('proximaRevision', () => {
    it('suma correctamente el intervalo al timestamp actual', () => {
      expect(proximaRevision(1000, 120000)).toBe(121000);
    });
  });

  describe('marcarLeida', () => {
    it('marca como leída únicamente la notificación indicada por id', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
      ];

      const resultado = marcarLeida(lista, '1');
      expect(resultado[0].estado).toBe('leida');
      expect(resultado[1].estado).toBe('entregada');
    });

    it('devuelve la lista sin cambios si el id no existe', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
      ];
      expect(marcarLeida(lista, '999')).toEqual(lista);
    });
  });

  describe('posponer', () => {
    it('manda el elemento al final de la cola sin marcarlo como leído', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'Primero', creadaEn: 1, estado: 'entregada' },
        { id: '2', tipo: 'recordatorios', urgencia: 3, titulo: 'Segundo', creadaEn: 2, estado: 'entregada' },
        { id: '3', tipo: 'sistema', urgencia: 2, titulo: 'Tercero', creadaEn: 3, estado: 'entregada' },
      ];

      const resultado = posponer(cola, '1');
      expect(resultado.map((n) => n.id)).toEqual(['2', '3', '1']);
      expect(resultado.find((n) => n.id === '1')?.estado).toBe('entregada');
    });

    it('posponer la última notificación la mantiene al final de la cola', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
      ];
      const resultado = posponer(cola, '2');
      expect(resultado.map((n) => n.id)).toEqual(['1', '2']);
    });

    it('funciona correctamente con una sola notificación', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
      ];
      const resultado = posponer(cola, '1');
      expect(resultado).toEqual(cola);
    });

    it('retorna la misma cola vacía o ante id inexistente', () => {
      expect(posponer([], '1')).toEqual([]);
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
      ];
      expect(posponer(cola, '999')).toEqual(cola);
    });
  });

  describe('colaDeRevision', () => {
    it('devuelve cola vacía si no hay notificaciones entregadas', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'retenida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'leida' },
      ];
      expect(colaDeRevision(lista)).toEqual([]);
    });

    it('ordena las urgentes primero respetando el orden de llegada en cada nivel', () => {
      const lista: Notificacion[] = [
        { id: 'normal-1', tipo: 'mensajes', urgencia: 3, titulo: 'N1', creadaEn: 100, estado: 'entregada' },
        { id: 'urgente-1', tipo: 'alertas', urgencia: 5, titulo: 'U1', creadaEn: 200, estado: 'entregada' },
        { id: 'normal-2', tipo: 'sistema', urgencia: 2, titulo: 'N2', creadaEn: 300, estado: 'entregada' },
        { id: 'urgente-2', tipo: 'alertas', urgencia: 5, titulo: 'U2', creadaEn: 400, estado: 'entregada' },
      ];

      const cola = colaDeRevision(lista);
      expect(cola.map((n) => n.id)).toEqual(['urgente-1', 'urgente-2', 'normal-1', 'normal-2']);
    });
  });

  describe('siguientePendiente', () => {
    it('retorna null en cola vacía', () => {
      expect(siguientePendiente([], null)).toBeNull();
      expect(siguientePendiente([], '1')).toBeNull();
    });

    it('retorna la primera pendiente cuando actualId es null', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
      ];
      expect(siguientePendiente(cola, null)).toBe('2');
    });

    it('avanza a la siguiente no leída', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
      ];
      expect(siguientePendiente(cola, '1')).toBe('2');
    });

    it('encuentra elementos pospuestos al inicio si ya no hay posteriores', () => {
      const cola: Notificacion[] = [
        { id: 'pospuesta', tipo: 'mensajes', urgencia: 3, titulo: 'P', creadaEn: 1, estado: 'entregada' },
        { id: 'actual', tipo: 'sistema', urgencia: 2, titulo: 'A', creadaEn: 2, estado: 'leida' },
      ];
      expect(siguientePendiente(cola, 'actual')).toBe('pospuesta');
    });

    it('devuelve null si todas están revisadas', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'leida' },
      ];
      expect(siguientePendiente(cola, '1')).toBeNull();
    });

    it('si el id actual no existe, devuelve la primera pendiente', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
      ];
      expect(siguientePendiente(cola, 'inexistente')).toBe('1');
    });

    it('ignora los IDs especificados en la lista de ignoradas / pospuestas', () => {
      const cola: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
      ];
      expect(siguientePendiente(cola, '1', ['2'])).toBeNull();
    });
  });

  describe('progresoRevision', () => {
    it('calcula correctamente el progreso en lista vacía', () => {
      expect(progresoRevision([])).toEqual({ revisadas: 0, total: 0 });
    });

    it('cuenta revisadas frente al total', () => {
      const lote: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'alertas', urgencia: 5, titulo: 'B', creadaEn: 2, estado: 'entregada' },
        { id: '3', tipo: 'sistema', urgencia: 2, titulo: 'C', creadaEn: 3, estado: 'leida' },
      ];
      expect(progresoRevision(lote)).toEqual({ revisadas: 2, total: 3 });
    });

    it('todas revisadas', () => {
      const lote: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'leida' },
      ];
      expect(progresoRevision(lote)).toEqual({ revisadas: 2, total: 2 });
    });
  });

  describe('quedanPospuestas', () => {
    it('devuelve false para lista o ids vacíos', () => {
      expect(quedanPospuestas([], [])).toBe(false);
      expect(quedanPospuestas([], ['1'])).toBe(false);
    });

    it('devuelve true si hay alguna pospuesta no leída', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'entregada' },
      ];
      expect(quedanPospuestas(lista, ['1'])).toBe(true);
    });

    it('devuelve false si todas las pospuestas ya fueron leídas', () => {
      const lista: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
      ];
      expect(quedanPospuestas(lista, ['1'])).toBe(false);
    });
  });

  describe('segmentosRevision', () => {
    it('genera segmentos con los 5 estados en orden de revisión', () => {
      const lote: Notificacion[] = [
        { id: '1', tipo: 'mensajes', urgencia: 3, titulo: 'A', creadaEn: 1, estado: 'leida' },
        { id: '2', tipo: 'sistema', urgencia: 2, titulo: 'B', creadaEn: 2, estado: 'entregada' },
        { id: '3', tipo: 'recordatorios', urgencia: 3, titulo: 'C', creadaEn: 3, estado: 'entregada' },
        { id: '4', tipo: 'alertas', urgencia: 5, titulo: 'D', creadaEn: 4, estado: 'entregada' },
        { id: '5', tipo: 'mensajes', urgencia: 2, titulo: 'E', creadaEn: 5, estado: 'entregada' },
      ];

      // id '2' es la actual, '3' es pospuesta, '4' es pendiente urgente, '5' es pendiente
      const segmentos = segmentosRevision(lote, '2', ['3']);

      expect(segmentos).toEqual([
        { id: '1', estado: 'revisada' },
        { id: '2', estado: 'actual' },
        { id: '3', estado: 'pospuesta' },
        { id: '4', estado: 'pendiente-urgente' },
        { id: '5', estado: 'pendiente' },
      ]);
    });
  });
});
