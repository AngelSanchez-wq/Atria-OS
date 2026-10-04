import { act, render, screen } from '@testing-library/react';
import App from './App';

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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el encendido y luego el marcador de inicio de sesión', async () => {
    render(<App />);

    expect(screen.getByText('Iniciando')).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Pantalla de inicio de sesión')).toBeInTheDocument();
  });
});
