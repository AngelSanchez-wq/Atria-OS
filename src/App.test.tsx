import { act, render, screen } from '@testing-library/react';
import App from './App';
import { useSesion } from './store/sesion';

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

  it('muestra el encendido y luego la pantalla de inicio de sesión', async () => {
    render(<App />);

    expect(screen.getByText('Iniciando')).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('¿Quién eres?')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mia' })).toBeInTheDocument();
  });
});
