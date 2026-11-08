import { describe, it, expect, beforeEach } from 'vitest';
import { useRegistroStore, CLAVE_PERSISTENCIA_REGISTRO } from './registro';
import { crearEvento } from '../kernel/logs/eventos';
import { MAXIMO_EVENTOS_REGISTRO } from '../kernel/logs/constantes';
import { platform } from '../platform/web';

describe('useRegistroStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRegistroStore.getState().limpiar();
  });

  it('agrega eventos y los persiste en platform', () => {
    const evento = crearEvento({
      categoria: 'sesion',
      gravedad: 'info',
      mensaje: 'Sesión iniciada',
      usuarioId: 'mia',
    });

    useRegistroStore.getState().agregar(evento);

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toEqual(evento);

    const persistido = platform.loadState(CLAVE_PERSISTENCIA_REGISTRO, []);
    expect(persistido).toEqual([evento]);
  });

  it('limpia todos los eventos y persiste la lista vacía', () => {
    const evento = crearEvento({
      categoria: 'seguridad',
      gravedad: 'aviso',
      mensaje: 'Alerta',
    });

    useRegistroStore.getState().agregar(evento);
    expect(useRegistroStore.getState().eventos).toHaveLength(1);

    useRegistroStore.getState().limpiar();
    expect(useRegistroStore.getState().eventos).toEqual([]);

    const persistido = platform.loadState(CLAVE_PERSISTENCIA_REGISTRO, [evento]);
    expect(persistido).toEqual([]);
  });

  it('descarta eventos antiguos al superar el límite máximo', () => {
    for (let i = 0; i < MAXIMO_EVENTOS_REGISTRO + 10; i += 1) {
      useRegistroStore.getState().agregar(
        crearEvento({
          categoria: 'proceso',
          gravedad: 'info',
          mensaje: `Evento ${i}`,
        })
      );
    }

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(MAXIMO_EVENTOS_REGISTRO);
    expect(eventos[0].mensaje).toBe('Evento 10');
    expect(eventos[MAXIMO_EVENTOS_REGISTRO - 1].mensaje).toBe(
      `Evento ${MAXIMO_EVENTOS_REGISTRO + 9}`
    );
  });
});
