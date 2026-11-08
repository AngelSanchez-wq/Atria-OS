import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useSesion } from './store/sesion';
import { useVentanas } from './store/ventanas';
import { useProcesos } from './store/procesos';
import { useTareas } from './store/tareas';
import { useEnergia } from './store/energia';
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
    useSesion.setState({
      usuario: null,
      estadosProcesosPorUsuario: {},
      tareasPorUsuario: {},
    });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useTareas.setState({
      tareaActiva: null,
      pendientes: [],
      estado: 'en-curso',
      segundosTranscurridos: 0,
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
    });
    useEnergia.setState({
      estado: 'encendiendo',
      estadosProcesosPrevios: {},
      dialogoConfirmacion: null,
    });
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

    const usuarioradio = screen.getByRole('radio', { name: 'Mateo' });
    act(() => {
      usuarioradio.click();
    });

    const usuarioMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo');
    const pin = usuarioMateo?.pin || '0000';

    act(() => {
      for (const char of pin) {
        fireEvent.keyDown(window, { key: char });
      }
    });

    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });

    // 3. Bienvenida
    expect(screen.getByText('Hola, Mateo')).toBeInTheDocument();

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

  it('soporta el cambio de usuario preservando y aislando las ventanas y procesos', async () => {
    render(<App />);

    // Arranque
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // ── Iniciar con Mateo ──
    act(() => {
      screen.getByRole('radio', { name: 'Mateo' }).click();
    });
    const pinMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo')?.pin || '5678';
    act(() => {
      for (const char of pinMateo) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // Mateo abre FocusPad
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'FocusPad' }));
    });
    expect(screen.getByRole('dialog', { name: 'FocusPad' })).toBeInTheDocument();

    // ── Cambiar de usuario a Mia ──
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mateo' }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Cambiar de usuario' }));
    });

    // Login general
    expect(screen.getByText('¿Quién eres?')).toBeInTheDocument();

    act(() => {
      screen.getByRole('radio', { name: 'Mia' }).click();
    });
    const pinMia = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mia')?.pin || '1234';
    act(() => {
      for (const char of pinMia) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // Mia no debe ver la ventana FocusPad de Mateo
    expect(screen.queryByRole('dialog', { name: 'FocusPad' })).not.toBeInTheDocument();

    // ── Volver con Mateo ──
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mia' }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Cambiar de usuario' }));
    });

    act(() => {
      screen.getByRole('radio', { name: 'Mateo' }).click();
    });
    act(() => {
      for (const char of pinMateo) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });

    // Mateo recupera su ventana
    expect(screen.getByRole('dialog', { name: 'FocusPad' })).toBeInTheDocument();
  });

  it('cerrar sesión pide confirmación y termina procesos del usuario', async () => {
    render(<App />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      screen.getByRole('radio', { name: 'Mateo' }).click();
    });
    const pinMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo')?.pin || '5678';
    act(() => {
      for (const char of pinMateo) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // Abrir menú de usuario y cerrar sesión
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mateo' }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    });

    // Diálogo de confirmación
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('¿Cerrar sesión de Mateo?')).toBeInTheDocument();

    // Confirmar
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    });

    // Vuelve al login
    expect(screen.getByText('¿Quién eres?')).toBeInTheDocument();
  });

  it('abre la app Ambient desde el dock y muestra su ventana con controles de sonido', async () => {
    render(<App />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      screen.getByRole('radio', { name: 'Mateo' }).click();
    });
    const pinMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo')?.pin || '5678';
    act(() => {
      for (const char of pinMateo) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // Abrir Ambient desde el dock
    const btnAmbient = screen.getByRole('button', { name: 'Ambient' });
    act(() => {
      fireEvent.click(btnAmbient);
    });

    expect(screen.getByRole('dialog', { name: 'Ambient' })).toBeInTheDocument();
    expect(screen.getByText('Sonido de fondo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lluvia' })).toBeInTheDocument();
  });

  it('soporta el flujo completo de terminar tarea, ver logro y pasar a la siguiente tarea', async () => {
    render(<App />);

    // 1. Encendido
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // 2. Login con Mateo
    act(() => {
      screen.getByRole('radio', { name: 'Mateo' }).click();
    });
    const pinMateo = USUARIOS_SEMILLA.find((u) => u.nombre === 'Mateo')?.pin || '5678';
    act(() => {
      for (const char of pinMateo) {
        fireEvent.keyDown(window, { key: char });
      }
    });
    act(() => {
      screen.getByRole('button', { name: 'Entrar' }).click();
    });

    // 3. Bienvenida: Empezar primera tarea
    expect(screen.getByText('Hola, Mateo')).toBeInTheDocument();
    act(() => {
      screen.getByRole('button', { name: 'Empezar' }).click();
    });

    // 4. Escritorio con tarea activa
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument();

    // 5. Terminar tarea -> Pantalla de logro
    act(() => {
      screen.getByRole('button', { name: 'Terminar' }).click();
    });

    expect(screen.getByText('Tarea completada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();

    // 6. Avanzar temporizador del logro (3000 ms) -> Vuelve al escritorio con la siguiente tarea
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Se oculta la pantalla de logro y vuelve al escritorio con botón Pausar
    expect(screen.queryByText('Tarea completada')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
  });
});

