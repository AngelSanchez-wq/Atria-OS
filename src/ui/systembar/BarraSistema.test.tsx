import { act, fireEvent, render, screen } from '@testing-library/react';
import { formatearFechaCorta, formatearHora } from '../../hooks/useHora';
import { useSesion } from '../../store/sesion';
import { Usuario } from '../../kernel/types';
import { LIMITES_USUARIO_POR_DEFECTO } from '../../kernel/users/constantes';
import { BarraSistema } from './BarraSistema';

const usuarioMia: Usuario = {
  id: 'mia',
  nombre: 'Mia',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
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

    render(<BarraSistema notificaciones={3} />);

    expect(screen.getByText(formatearHora(momento))).toBeInTheDocument();
    expect(screen.getByText(formatearFechaCorta(momento))).toBeInTheDocument();
    expect(screen.getByText('72 %')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('expone aria-label en los botones de estado', () => {
    render(<BarraSistema notificaciones={3} />);

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

    render(
      <BarraSistema
        notificaciones={3}
        onVolver={onVolver}
        onWifi={onWifi}
        onVolumen={onVolumen}
        onBateria={onBateria}
        onNotificaciones={onNotificaciones}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '← Escritorio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wi‑Fi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volumen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batería 72 %' }));
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones, 3' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(onWifi).toHaveBeenCalledTimes(1);
    expect(onVolumen).toHaveBeenCalledTimes(1);
    expect(onBateria).toHaveBeenCalledTimes(1);
    expect(onNotificaciones).toHaveBeenCalledTimes(1);
  });

  it('no muestra el globo contador cuando no hay notificaciones sin leer', () => {
    render(<BarraSistema notificaciones={0} />);
    expect(screen.getByRole('button', { name: 'Notificaciones, 0' })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('despliega el menú de encendido y ejecuta las acciones seleccionadas', () => {
    const onBloquear = vi.fn();
    render(<BarraSistema onBloquear={onBloquear} />);

    // Abrir menú de encendido
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o reiniciar' }));
    expect(screen.getByRole('menu', { name: 'Menú de encendido' })).toBeInTheDocument();

    // Clic en Bloquear
    fireEvent.click(screen.getByRole('menuitem', { name: 'Bloquear' }));
    expect(onBloquear).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu', { name: 'Menú de encendido' })).not.toBeInTheDocument();
  });

  it('despliega el menú de usuario y ejecuta cambiar de usuario', () => {
    const onCambiarUsuario = vi.fn();
    render(<BarraSistema onCambiarUsuario={onCambiarUsuario} />);

    // Clic en el avatar de usuario
    fireEvent.click(screen.getByRole('button', { name: 'Mia' }));
    expect(screen.getByRole('menu', { name: 'Menú de usuario' })).toBeInTheDocument();

    // Clic en Cambiar de usuario
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cambiar de usuario' }));
    expect(onCambiarUsuario).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu', { name: 'Menú de usuario' })).not.toBeInTheDocument();
  });

  it('actualiza la hora cuando avanza el temporizador', async () => {
    render(<BarraSistema />);

    expect(screen.getByText('10:42')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText('10:43')).toBeInTheDocument();
  });

  it('el búho recibe y muestra cada estado con su texto alternativo', () => {
    const { rerender } = render(<BarraSistema estadoBuho="foco" />);
    expect(screen.getByRole('img', { name: 'Atria-OS, en foco' })).toBeInTheDocument();

    rerender(<BarraSistema estadoBuho="reposo" />);
    expect(screen.getByRole('img', { name: 'Atria-OS, en reposo' })).toBeInTheDocument();

    rerender(<BarraSistema estadoBuho="logro" />);
    expect(screen.getByRole('img', { name: 'Tarea completada' })).toBeInTheDocument();
  });
});
