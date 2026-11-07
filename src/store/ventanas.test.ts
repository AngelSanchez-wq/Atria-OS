import { describe, it, expect, beforeEach } from 'vitest';
import { useVentanas, VENTANA_ANCHO_INICIAL, VENTANA_ALTO_INICIAL } from './ventanas';

describe('Store Ventanas', () => {
  beforeEach(() => {
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
    });
  });

  it('abrir crea una ventana con los valores iniciales correctos', () => {
    useVentanas.getState().abrir('focuspad', 1, 'mateo');
    const { ventanas, focusPid } = useVentanas.getState();
    expect(ventanas).toHaveLength(1);
    expect(ventanas[0].appId).toBe('focuspad');
    expect(ventanas[0].pid).toBe(1);
    expect(ventanas[0].usuarioId).toBe('mateo');
    expect(ventanas[0].ancho).toBe(VENTANA_ANCHO_INICIAL);
    expect(ventanas[0].alto).toBe(VENTANA_ALTO_INICIAL);
    expect(ventanas[0].estado).toBe('normal');
    expect(focusPid).toBe(ventanas[0].id);
  });

  it('cerrarDeUsuario cierra solo las ventanas del usuario indicado', () => {
    useVentanas.getState().abrir('focuspad', 1, 'mateo');
    useVentanas.getState().abrir('timelapse', 2, 'mia');

    useVentanas.getState().cerrarDeUsuario('mateo');
    const { ventanas } = useVentanas.getState();
    expect(ventanas).toHaveLength(1);
    expect(ventanas[0].usuarioId).toBe('mia');
  });

  it('abrir dos ventanas las posiciona en cascada', () => {
    useVentanas.getState().abrir('focuspad', 1);
    useVentanas.getState().abrir('timelapse', 2);
    const { ventanas } = useVentanas.getState();
    expect(ventanas[1].x).toBeGreaterThan(ventanas[0].x);
    expect(ventanas[1].y).toBeGreaterThan(ventanas[0].y);
  });

  it('minimizar oculta la ventana y mueve el foco a la siguiente', () => {
    useVentanas.getState().abrir('focuspad', 1);
    useVentanas.getState().abrir('timelapse', 2);
    const ids = useVentanas.getState().ventanas.map((v) => v.id);

    useVentanas.getState().minimizar(ids[1]);
    const { ventanas, focusPid } = useVentanas.getState();
    expect(ventanas.find((v) => v.id === ids[1])?.estado).toBe('minimizada');
    expect(focusPid).toBe(ids[0]);
  });

  it('restaurar una ventana minimizada la pone en estado normal y la enfoca', () => {
    useVentanas.getState().abrir('focuspad', 1);
    const id = useVentanas.getState().ventanas[0].id;

    useVentanas.getState().minimizar(id);
    expect(useVentanas.getState().ventanas[0].estado).toBe('minimizada');

    useVentanas.getState().restaurar(id);
    expect(useVentanas.getState().ventanas[0].estado).toBe('normal');
    expect(useVentanas.getState().focusPid).toBe(id);
  });

  it('cerrar elimina la ventana y ajusta el foco', () => {
    useVentanas.getState().abrir('focuspad', 1);
    useVentanas.getState().abrir('timelapse', 2);
    const ids = useVentanas.getState().ventanas.map((v) => v.id);

    useVentanas.getState().cerrar(ids[1]);
    expect(useVentanas.getState().ventanas).toHaveLength(1);
    expect(useVentanas.getState().focusPid).toBe(ids[0]);
  });

  it('maximizar alterna entre maximizada y normal', () => {
    useVentanas.getState().abrir('focuspad', 1);
    const id = useVentanas.getState().ventanas[0].id;

    useVentanas.getState().maximizar(id);
    expect(useVentanas.getState().ventanas[0].estado).toBe('maximizada');

    useVentanas.getState().maximizar(id);
    expect(useVentanas.getState().ventanas[0].estado).toBe('normal');
  });

  it('enfocar incrementa el ordenFoco y actualiza focusPid', () => {
    useVentanas.getState().abrir('focuspad', 1);
    useVentanas.getState().abrir('timelapse', 2);
    const ids = useVentanas.getState().ventanas.map((v) => v.id);

    useVentanas.getState().enfocar(ids[0]);
    const { ventanas, focusPid } = useVentanas.getState();
    expect(focusPid).toBe(ids[0]);
    expect(ventanas.find((v) => v.id === ids[0])!.ordenFoco)
      .toBeGreaterThan(ventanas.find((v) => v.id === ids[1])!.ordenFoco);
  });

  it('mover actualiza la posición de la ventana', () => {
    useVentanas.getState().abrir('focuspad', 1);
    const id = useVentanas.getState().ventanas[0].id;

    useVentanas.getState().mover(id, 200, 150);
    const ventana = useVentanas.getState().ventanas[0];
    expect(ventana.x).toBe(200);
    expect(ventana.y).toBe(150);
  });
});
