import { describe, it, expect, beforeEach } from 'vitest';
import { registrar, obtenerEventos, limpiarRegistro } from './servicio';

describe('Servicio de logging', () => {
  beforeEach(() => {
    localStorage.clear();
    limpiarRegistro();
  });

  it('registra un evento y lo agrega al store', () => {
    const evento = registrar({
      categoria: 'sesion',
      gravedad: 'info',
      mensaje: 'Inicio de sesión correcto: Mia',
      usuarioId: 'mia',
    });

    expect(evento.id).toBeDefined();
    expect(evento.mensaje).toBe('Inicio de sesión correcto: Mia');

    const lista = obtenerEventos();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toEqual(evento);
  });

  it('limpia todos los eventos registrados', () => {
    registrar({
      categoria: 'energia',
      gravedad: 'info',
      mensaje: 'Sistema bloqueado',
    });

    expect(obtenerEventos()).toHaveLength(1);

    limpiarRegistro();
    expect(obtenerEventos()).toHaveLength(0);
  });
});
