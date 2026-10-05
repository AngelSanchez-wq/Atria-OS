import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useSesion } from './store/sesion';
import { useVentanas } from './store/ventanas';
import { useProcesos } from './store/procesos';
import { useTareas } from './store/tareas';
import { USUARIOS_SEMILLA } from './kernel/users/usuarios-semilla';

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
    useProcesos.setState({ procesos: [] });
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
});
