import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useSesion } from './store/sesion';
import { useVentanas } from './store/ventanas';
import { useProcesos } from './store/procesos';
import { useTareas } from './store/tareas';
import { USUARIOS_SEMILLA } from './kernel/users/usuarios-semilla';
import { PROCESO_KERNEL_BASE } from './kernel/processes/constantes';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSesion.setState({ usuario: null });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useTareas.setState({ tareaActiva: null, pendientes: [], estado: 'en-curso', segundosTranscurridos: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el encendido, el login, la Bienvenida, el Escritorio y abre una app desde el dock', async () => {
    render(<App />);

    // 1. Encendido
    expect(screen.getByText('Iniciando')).toBeInTheDocument();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // 2. Login
    expect(screen.getByText('¿Quién eres?')).toBeInTheDocument();

    // Seleccionar usuario
    const usuarioradio = screen.getByRole('radio', { name: 'Mateo' });
    act(() => {
      usuarioradio.click();
    });

    // Ingresar el PIN obteniéndolo de la semilla
    const usuarioMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo');
    const pin = usuarioMateo?.pin || '0000';

    act(() => {
      for (const char of pin) {
        fireEvent.keyDown(window, { key: char });
      }
    });

    // Iniciar sesión
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });

    // 3. Bienvenida
    expect(screen.getByText('Hola, Mateo')).toBeInTheDocument();
    expect(screen.getByText('¿Empezamos con algo pequeño?')).toBeInTheDocument();

    const btnEmpezar = screen.getByRole('button', { name: 'Empezar' });
    act(() => {
      btnEmpezar.click();
    });

    // 4. Escritorio
    expect(screen.getByRole('navigation', { name: 'Aplicaciones' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();

    // 5. Abrir una app desde el dock
    const btnDock = screen.getByRole('button', { name: 'FocusPad' });
    act(() => {
      fireEvent.click(btnDock);
    });

    expect(screen.getByRole('dialog', { name: 'FocusPad' })).toBeInTheDocument();
  });

  it('iniciar como Admin permite abrir el Monitor de procesos y ver el kernel', async () => {
    render(<App />);

    // Encendido
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Seleccionar usuario Admin
    const usuarioradio = screen.getByRole('radio', { name: 'Admin' });
    act(() => {
      usuarioradio.click();
    });

    const usuarioAdmin = USUARIOS_SEMILLA.find((u) => u.nombre === 'Admin');
    const pin = usuarioAdmin?.pin || '0000';

    act(() => {
      for (const char of pin) {
        fireEvent.keyDown(window, { key: char });
      }
    });

    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });

    // Bienvenida -> Escritorio
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // Abrir Monitor de procesos desde el Dock (solo visible para admin)
    const btnMonitor = screen.getByRole('button', { name: 'Monitor de procesos' });
    expect(btnMonitor).toBeInTheDocument();

    act(() => {
      fireEvent.click(btnMonitor);
    });

    expect(screen.getByRole('dialog', { name: 'Monitor de procesos' })).toBeInTheDocument();
    expect(screen.getByText('Kernel de Atria-OS')).toBeInTheDocument();
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });
});
