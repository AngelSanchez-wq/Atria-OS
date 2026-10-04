import { act, render, screen } from '@testing-library/react';
import { NOMBRE_SISTEMA } from '../../config/sistema';
import { PantallaEncendido } from './PantallaEncendido';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe('PantallaEncendido', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra Atria-OS, Iniciando, la barra accesible y llama a onTerminar', async () => {
    const onTerminar = vi.fn();

    render(<PantallaEncendido onTerminar={onTerminar} />);

    expect(screen.getByRole('heading', { name: NOMBRE_SISTEMA })).toBeInTheDocument();
    expect(screen.getByText('Iniciando')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Iniciando el sistema' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Búho en reposo' })).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onTerminar).toHaveBeenCalledTimes(1);
  });
});
