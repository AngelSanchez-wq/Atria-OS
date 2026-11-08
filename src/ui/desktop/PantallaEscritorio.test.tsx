import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaEscritorio } from './PantallaEscritorio';
import { useTareas } from '../../store/tareas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { Usuario, Tarea } from '../../kernel/types';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

vi.mock('../systembar/BarraSistema', () => ({
  BarraSistema: ({
    titulo,
    estadoBuho,
  }: {
    titulo?: string;
    estadoBuho?: string;
  }) => (
    <div data-testid="barra-sistema" data-estadobuho={estadoBuho}>
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
    useSesion.setState({ usuario: USUARIOS_SEMILLA[0] });
    useTareas.setState({
      tareaActiva: null,
      pendientes: [],
      estado: 'en-curso',
      segundosTranscurridos: 0,
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
    });
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
      ultimoRechazoApertura: null,
    });
    useProcesos.setState({ procesos: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el estado vacío cuando no hay tarea activa', () => {
    render(<PantallaEscritorio />);
    expect(screen.getByText('No tienes tareas pendientes')).toBeInTheDocument();
    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'reposo');
  });

  it('muestra la tarea activa y avanza el tiempo', () => {
    useTareas.getState().empezar(tarea1);

    render(<PantallaEscritorio />);

    expect(screen.getByText('Hacer test')).toBeInTheDocument();
    expect(screen.getByText(/00:00 de 01:00/)).toBeInTheDocument();
    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'foco');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/01:00 de 01:00/)).toBeInTheDocument();
  });

  it('permite pausar y reanudar cambiando el estado del búho', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'foco');

    const btnPausar = screen.getByRole('button', { name: 'Pausar' });
    act(() => {
      fireEvent.click(btnPausar);
    });

    expect(screen.getByText(/En pausa/)).toBeInTheDocument();
    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'reposo');

    const btnReanudar = screen.getByRole('button', { name: 'Reanudar' });
    act(() => {
      fireEvent.click(btnReanudar);
    });

    expect(screen.getByText(/En curso/)).toBeInTheDocument();
    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'foco');
  });

  it('terminar lleva a la pantalla de logro con búho en logro', () => {
    useTareas.getState().empezar(tarea1);
    render(<PantallaEscritorio />);

    const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
    act(() => {
      fireEvent.click(btnTerminar);
    });

    expect(screen.getByText('Tarea completada')).toBeInTheDocument();
    expect(screen.getByText('Hacer test')).toBeInTheDocument();
    expect(screen.getByTestId('barra-sistema')).toHaveAttribute('data-estadobuho', 'logro');
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

  it('muestra el diálogo tranquilo de rechazo cuando una app está deshabilitada en el perfil', () => {
    useTareas.getState().empezar(tarea1);
    const usuarioConLimites: Usuario = {
      ...USUARIOS_SEMILLA[0],
      limites: {
        ...USUARIOS_SEMILLA[0].limites,
        appsHabilitadas: ['focuspad'], // Timelapse no está habilitada
      },
    };
    useSesion.setState({ usuario: usuarioConLimites });

    render(<PantallaEscritorio />);

    const btnDockTimelapse = screen.getByRole('button', { name: 'TimeLapse' });
    act(() => {
      fireEvent.click(btnDockTimelapse);
    });

    // No se abrió la ventana de la app
    expect(useVentanas.getState().ventanas).toHaveLength(0);

    // Se muestra el diálogo modal tranquilo con candado
    expect(screen.getByText('TimeLapse no está disponible')).toBeInTheDocument();
    expect(
      screen.getByText('El administrador la desactivó para tu perfil.')
    ).toBeInTheDocument();

    // Se puede cerrar con el botón Entendido
    const btnEntendido = screen.getByRole('button', { name: 'Entendido' });
    act(() => {
      fireEvent.click(btnEntendido);
    });

    expect(screen.queryByText('TimeLapse no está disponible')).not.toBeInTheDocument();
    expect(useVentanas.getState().ultimoRechazoApertura).toBeNull();
  });

  it('muestra el diálogo de memoria insuficiente cuando se excede la memoria del perfil', () => {
    useTareas.getState().empezar(tarea1);
    const usuarioSinMemoria: Usuario = {
      ...USUARIOS_SEMILLA[0],
      limites: {
        ...USUARIOS_SEMILLA[0].limites,
        appsHabilitadas: ['focuspad', 'timelapse'],
        memoriaMaximaMb: 128, // Menor que lo requerido por FocusPad (256 MB)
      },
    };
    useSesion.setState({ usuario: usuarioSinMemoria });

    render(<PantallaEscritorio />);

    const btnDock = screen.getByRole('button', { name: 'FocusPad' });
    act(() => {
      fireEvent.click(btnDock);
    });

    expect(
      screen.getByText('No hay memoria disponible para tu perfil')
    ).toBeInTheDocument();
    expect(screen.getByText('Cierra una app para abrir otra.')).toBeInTheDocument();
  });
});