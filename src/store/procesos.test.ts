import { describe, it, expect, beforeEach } from 'vitest';
import { useProcesos } from './procesos';

describe('Store Procesos', () => {
  beforeEach(() => {
    useProcesos.setState({ procesos: [] });
  });

  it('lanzar crea un proceso y lo añade a la lista', () => {
    const proceso = useProcesos.getState().lanzar('timelapse', 'mateo');
    expect(proceso).not.toBeNull();
    expect(useProcesos.getState().procesos).toHaveLength(1);
    expect(useProcesos.getState().procesos[0].nombre).toBe('timelapse');
    expect(useProcesos.getState().procesos[0].estado).toBe('Nuevo');
  });

  it('lanzar devuelve null si no hay memoria', () => {
    // Llenamos la memoria con procesos ficticios
    useProcesos.setState({
      procesos: [
        { pid: 1, estado: 'En ejecución', memoriaMb: 2048, nombre: 'fake',
          prioridad: 1, usuarioId: 'test', creadoEn: 0, tipoApp: 'interna' },
      ],
    });

    const resultado = useProcesos.getState().lanzar('focuspad', 'mateo');
    expect(resultado).toBeNull();
  });

  it('cambiarEstado actualiza solo el proceso indicado', () => {
    useProcesos.getState().lanzar('focuspad', 'mateo');
    const pid = useProcesos.getState().procesos[0].pid;

    useProcesos.getState().cambiarEstado(pid, 'En ejecución');
    expect(useProcesos.getState().procesos[0].estado).toBe('En ejecución');
  });

  it('terminar marca el proceso como Terminado', () => {
    useProcesos.getState().lanzar('tagfs', 'mateo');
    const pid = useProcesos.getState().procesos[0].pid;

    useProcesos.getState().terminar(pid);
    expect(useProcesos.getState().procesos[0].estado).toBe('Terminado');
  });
});
