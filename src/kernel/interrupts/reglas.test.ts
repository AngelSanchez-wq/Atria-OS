import { describe, it, expect } from 'vitest';
import {
  nivelDeUrgencia,
  decidirEntrega,
  agruparPorNivel,
  contarPorTipo,
  entregarLote,
  marcarLeidas,
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
});
