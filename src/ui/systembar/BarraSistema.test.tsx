import { act, fireEvent, render, screen } from '@testing-library/react';
import { formatearFechaCorta, formatearHora } from '../../hooks/useHora';
import { useSesion } from '../../store/sesion';
import type { Usuario } from '../../kernel/types';
import { BarraSistema } from './BarraSistema';

const usuarioMia: Usuario = {
  id: 'mia',
  nombre: 'Mia',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
};

describe('BarraSistema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Miércoles 30 de septiembre de 2020, 10:42
    vi.setSystemTime(new Date(2020, 8, 30, 10, 42, 0));
    useSesion.setState({ usuario: usuarioMia });
  });

  afterEach(() => {
    vi.useRealTimers();
    useSesion.setState({ usuario: null });
  });

  it('muestra hora, batería, contador e inicial del usuario', () => {
    const momento = new Date(2020, 8, 30, 10, 42, 0);

    render(<BarraSistema />);

    expect(screen.getByText(formatearHora(momento))).toBeInTheDocument();
    expect(screen.getByText(formatearFechaCorta(momento))).toBeInTheDocument();
    expect(screen.getByText('72 %')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('expone aria-label en los botones de estado', () => {
    render(<BarraSistema />);

    expect(screen.getByRole('button', { name: 'Wi‑Fi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volumen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batería 72 %' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Notificaciones, 3' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Apagar o reiniciar' }),
    ).toBeInTheDocument();
  });

  it('muestra "← Escritorio" solo si hay onVolver', () => {
    const { rerender } = render(<BarraSistema />);
    expect(screen.queryByRole('button', { name: '← Escritorio' })).not.toBeInTheDocument();

    rerender(<BarraSistema onVolver={() => undefined} />);
    expect(screen.getByRole('button', { name: '← Escritorio' })).toBeInTheDocument();
  });

  it('llama a los callbacks al hacer clic', () => {
    const onVolver = vi.fn();
    const onWifi = vi.fn();
    const onVolumen = vi.fn();
    const onBateria = vi.fn();
    const onNotificaciones = vi.fn();
    const onEncendido = vi.fn();

    render(
      <BarraSistema
        onVolver={onVolver}
        onWifi={onWifi}
        onVolumen={onVolumen}
        onBateria={onBateria}
        onNotificaciones={onNotificaciones}
        onEncendido={onEncendido}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '← Escritorio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wi‑Fi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volumen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batería 72 %' }));
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones, 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o reiniciar' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(onWifi).toHaveBeenCalledTimes(1);
    expect(onVolumen).toHaveBeenCalledTimes(1);
    expect(onBateria).toHaveBeenCalledTimes(1);
    expect(onNotificaciones).toHaveBeenCalledTimes(1);
    expect(onEncendido).toHaveBeenCalledTimes(1);
  });

  it('actualiza la hora cuando avanza el temporizador', async () => {
    render(<BarraSistema />);

    expect(screen.getByText('10:42')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText('10:43')).toBeInTheDocument();
  });
});
