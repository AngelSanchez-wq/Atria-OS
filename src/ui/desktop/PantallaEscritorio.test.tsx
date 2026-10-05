import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaEscritorio } from './PantallaEscritorio';
import { useTareas } from '../../store/tareas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { Tarea } from '../../kernel/types';

vi.mock('../systembar/BarraSistema', () => ({
  BarraSistema: ({ titulo }: { titulo?: string }) => (
    <div data-testid="barra-sistema">
      {titulo && <span data-testid="titulo-barra">{titulo}</span>}
    </div>
  ),
}));

describe('PantallaEscritorio', () => {
  const tarea1: Tarea = {
    id: 't1',
    titulo: 'Hacer test',
    app: 'focuspad',
    minutos: 1,
    etiqueta: 'code',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    useTareas.setState({
      tareaActiva: null,
      pendientes: [],
      estado: 'en-curso',
      segundosTranscurridos: 0,
    });
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
    });
    useProcesos.setState({ procesos: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el estado vacío cuando no hay tarea activa', () => {
    render(<PantallaEscritorio />);
    expect(screen.getByText(/Logro: pendiente/)).toBeInTheDocument();
  });

  it('muestra la tarea activa y avanza el tiempo', () => {
    useTareas.getState().empezar(tarea1);

    render(<PantallaEscritorio />);

    expect(screen.getByText('Hacer test')).toBeInTheDocument();
    expect(screen.getByText(/00:00 de 01:00/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/01:00 de 01:00/)).toBeInTheDocument();
  });

  it('permite pausar y reanudar', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    const btnPausar = screen.getByRole('button', { name: 'Pausar' });
    act(() => {
      fireEvent.click(btnPausar);
    });

    expect(screen.getByText(/En pausa/)).toBeInTheDocument();

    const btnReanudar = screen.getByRole('button', { name: 'Reanudar' });
    act(() => {
      fireEvent.click(btnReanudar);
    });

    expect(screen.getByText(/En curso/)).toBeInTheDocument();
  });

  it('terminar cierra la tarea', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
    act(() => {
      fireEvent.click(btnTerminar);
    });

    expect(screen.getByText(/Logro: pendiente/)).toBeInTheDocument();
  });

  it('abre una ventana desde el dock y pasa el título a la barra del sistema', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    const btnDock = screen.getByRole('button', { name: 'TimeLapse' });
    act(() => {
      fireEvent.click(btnDock);
    });

    // La ventana TimeLapse debe haberse abierto
    expect(screen.getByRole('dialog', { name: 'TimeLapse' })).toBeInTheDocument();
    // La barra del sistema debe mostrar el título de la ventana enfocada
    expect(screen.getByTestId('titulo-barra')).toHaveTextContent('TimeLapse');
  });

  it('no abre dos ventanas de la misma app sino que enfoca la existente', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    const btnDock = screen.getByRole('button', { name: 'TimeLapse' });
    act(() => {
      fireEvent.click(btnDock);
    });
    expect(screen.getAllByRole('dialog', { name: 'TimeLapse' })).toHaveLength(1);

    // Segundo clic en el mismo icono
    act(() => {
      fireEvent.click(btnDock);
    });
    expect(screen.getAllByRole('dialog', { name: 'TimeLapse' })).toHaveLength(1);
  });
});