import { describe, it, expect } from 'vitest';
import {
  crearEvento,
  agregarEvento,
  filtrarPorCategoria,
  ordenarPorInstante,
} from './eventos';
import { EventoSistema } from './types';
import { MAXIMO_EVENTOS_REGISTRO } from './constantes';

describe('Funciones puras de eventos de sistema', () => {
  describe('crearEvento', () => {
    it('crea un evento con los valores proporcionados y valores por defecto', () => {
      const ahora = 1600000000000;
      const evento = crearEvento({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Sesión iniciada',
        usuarioId: 'mia',
        instante: ahora,
        id: 'evt-custom-1',
      });

      expect(evento).toEqual({
        id: 'evt-custom-1',
        instante: ahora,
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Sesión iniciada',
        usuarioId: 'mia',
      });
    });

    it('genera id e instante automáticamente si no se especifican', () => {
      const evento = crearEvento({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'Aviso de seguridad',
      });

      expect(evento.id).toBeDefined();
      expect(typeof evento.instante).toBe('number');
      expect(evento.instante).toBeGreaterThan(0);
      expect(evento.usuarioId).toBeUndefined();
    });
  });

  describe('agregarEvento', () => {
    it('agrega un evento al final de la lista', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '1' });
      const e2 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '2' });

      const res = agregarEvento([e1], e2);
      expect(res).toHaveLength(2);
      expect(res[0]).toBe(e1);
      expect(res[1]).toBe(e2);
    });

    it('no muta el arreglo original', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '1' });
      const e2 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '2' });
      const listaOriginal = [e1];

      const res = agregarEvento(listaOriginal, e2);
      expect(listaOriginal).toHaveLength(1);
      expect(res).not.toBe(listaOriginal);
    });

    it('descarta los eventos más antiguos al superar el límite máximo', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '1' });
      const e2 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '2' });
      const e3 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '3' });
      const e4 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '4' });

      // Límite de 3 eventos
      const res = agregarEvento([e1, e2, e3], e4, 3);
      expect(res).toHaveLength(3);
      expect(res.map((e) => e.mensaje)).toEqual(['2', '3', '4']);
    });

    it('respeta la constante por defecto MAXIMO_EVENTOS_REGISTRO', () => {
      const eventos: EventoSistema[] = [];
      for (let i = 0; i < MAXIMO_EVENTOS_REGISTRO; i += 1) {
        eventos.push(
          crearEvento({ categoria: 'proceso', gravedad: 'info', mensaje: `msg-${i}` })
        );
      }

      const nuevo = crearEvento({ categoria: 'proceso', gravedad: 'info', mensaje: 'nuevo' });
      const res = agregarEvento(eventos, nuevo);

      expect(res).toHaveLength(MAXIMO_EVENTOS_REGISTRO);
      expect(res[res.length - 1].mensaje).toBe('nuevo');
      expect(res[0].mensaje).toBe('msg-1');
    });
  });

  describe('filtrarPorCategoria', () => {
    it('filtra correctamente por categoría seleccionada', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: 's1' });
      const e2 = crearEvento({ categoria: 'seguridad', gravedad: 'aviso', mensaje: 'seg1' });
      const e3 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: 's2' });
      const e4 = crearEvento({ categoria: 'energia', gravedad: 'info', mensaje: 'e1' });

      const lista = [e1, e2, e3, e4];

      expect(filtrarPorCategoria(lista, 'sesion')).toEqual([e1, e3]);
      expect(filtrarPorCategoria(lista, 'seguridad')).toEqual([e2]);
      expect(filtrarPorCategoria(lista, 'energia')).toEqual([e4]);
      expect(filtrarPorCategoria(lista, 'proceso')).toEqual([]);
    });
  });

  describe('ordenarPorInstante', () => {
    it('ordena por defecto del más reciente al más antiguo (descendente)', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '1', instante: 100 });
      const e2 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '2', instante: 300 });
      const e3 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '3', instante: 200 });

      const ordenados = ordenarPorInstante([e1, e2, e3]);
      expect(ordenados.map((e) => e.mensaje)).toEqual(['2', '3', '1']);
    });

    it('ordena en orden ascendente (del más antiguo al más reciente) si se especifica', () => {
      const e1 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '1', instante: 100 });
      const e2 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '2', instante: 300 });
      const e3 = crearEvento({ categoria: 'sesion', gravedad: 'info', mensaje: '3', instante: 200 });

      const ordenados = ordenarPorInstante([e1, e2, e3], 'asc');
      expect(ordenados.map((e) => e.mensaje)).toEqual(['1', '3', '2']);
    });
  });
});
