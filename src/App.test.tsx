import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useSesion } from './store/sesion';
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el encendido, el login, la Bienvenida y finalmente el Escritorio pendiente', async () => {
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
    expect(screen.getByText(/Escritorio: pendiente/)).toBeInTheDocument();
  });
});
