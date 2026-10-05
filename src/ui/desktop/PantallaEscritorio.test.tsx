import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaEscritorio } from './PantallaEscritorio';
import { useTareas } from '../../store/tareas';
import { Tarea } from '../../kernel/types';


vi.mock('../systembar/BarraSistema', () => ({
  BarraSistema: () => <div data-testid="barra-sistema" />,
}));

describe('PantallaEscritorio', () => {
  const tarea1: Tarea = { id: 't1', titulo: 'Hacer test', app: 'focuspad', minutos: 1, etiqueta: 'code' };

  beforeEach(() => {
    vi.useFakeTimers();
    useTareas.setState({
      tareaActiva: null,
      pendientes: [],
      estado: 'en-curso',
      segundosTranscurridos: 0,
    });
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
  
        // Con FACTOR_VELOCIDAD_DEMO = 60, un segundo real equivale a un minuto simulado.
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
});