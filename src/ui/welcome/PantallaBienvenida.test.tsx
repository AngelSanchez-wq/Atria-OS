import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaBienvenida } from './PantallaBienvenida';
import { useSesion } from '../../store/sesion';
import { useTareas } from '../../store/tareas';
import { useUsuariosStore } from '../../store/usuarios';
import { TAREAS_SEMILLA } from '../../kernel/tasks/tareas-semilla';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

// Mock de BarraSistema para no renderizar su complejidad
vi.mock('../systembar/BarraSistema', () => ({
  BarraSistema: () => <div data-testid="barra-sistema" />,
}));

describe('PantallaBienvenida', () => {
  const valery = USUARIOS_SEMILLA[0];

  beforeEach(() => {
    localStorage.clear();
    useUsuariosStore.getState().restablecer();
    useTareas.setState({
      tareaActiva: null,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: [],
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
      tareasPorUsuario: {},
      inicializadas: {},
      sugerenciaActualId: null,
    });
    useSesion.setState({ usuario: valery });
    useTareas.getState().inicializarUsuario(valery.id);
  });

  it('saluda al usuario y muestra la primera tarea', () => {
    render(<PantallaBienvenida onEmpezar={vi.fn()} />);

    expect(screen.getByText(`Hola, ${valery.nombre}`)).toBeInTheDocument();
    expect(screen.getByText(TAREAS_SEMILLA[0].titulo)).toBeInTheDocument();
  });

  it('cambia de sugerencia al hacer clic en Otra sugerencia', () => {
    render(<PantallaBienvenida onEmpezar={vi.fn()} />);

    expect(screen.getByText(TAREAS_SEMILLA[0].titulo)).toBeInTheDocument();

    const btnOtra = screen.getByRole('button', { name: 'Otra sugerencia' });

    act(() => {
      fireEvent.click(btnOtra);
    });

    expect(screen.getByText(TAREAS_SEMILLA[1].titulo)).toBeInTheDocument();
  });

  it('llama a onEmpezar con la tarea mostrada', () => {
    const mockEmpezar = vi.fn();

    render(<PantallaBienvenida onEmpezar={mockEmpezar} />);

    const btnEmpezar = screen.getByRole('button', { name: 'Empezar' });

    act(() => {
      fireEvent.click(btnEmpezar);
    });

    expect(mockEmpezar).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: TAREAS_SEMILLA[0].titulo,
        usuarioId: valery.id,
      })
    );
  });

  it('muestra la píldora Importante y sustituye Otra sugerencia cuando hay una tarea importante', () => {
    act(() => {
      useTareas.getState().crear({
        titulo: 'Entregar el informe',
        app: 'focuspad',
        minutos: 25,
        etiqueta: 'estudio',
        importante: true,
      });
    });

    render(<PantallaBienvenida onEmpezar={vi.fn()} />);

    expect(screen.getByText('Entregar el informe')).toBeInTheDocument();
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Esta tarea es importante hoy.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Otra sugerencia' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeInTheDocument();
  });

  it('muestra estado calmado y botón Crear mi primera tarea cuando no hay tareas', () => {
    useTareas.setState({
      tareasPorUsuario: { [valery.id]: [] },
      inicializadas: { [valery.id]: true },
    });

    render(<PantallaBienvenida onEmpezar={vi.fn()} />);

    expect(screen.getByText('Aún no tienes tareas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear mi primera tarea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva tarea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mis tareas' })).toBeInTheDocument();
  });
});
