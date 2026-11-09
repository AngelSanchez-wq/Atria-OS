import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  it('expone aria-label dinámicos según el estado en los botones de estado', () => {
    render(<BarraSistema notificaciones={3} />);

    expect(
      screen.getByRole('button', { name: 'Wi-Fi, conectado a Casa-5G' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volumen' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Batería 72 %, descargando' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Notificaciones, 3' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Apagar o reiniciar' })
    ).toBeInTheDocument();
  });

  it('refleja "Wi-Fi, sin conexión" cuando la red real está desconectada', () => {
    render(<BarraSistema redEnLinea={false} />);

    expect(
      screen.getByRole('button', { name: 'Wi-Fi, sin conexión' })
    ).toBeInTheDocument();
  });

  it('refleja "Wi-Fi desactivado" cuando el interruptor simulado está apagado', () => {
    render(<BarraSistema wifiHabilitado={false} />);

    expect(
      screen.getByRole('button', { name: 'Wi-Fi desactivado' })
    ).toBeInTheDocument();
  });

  it('refleja el estado de carga en la etiqueta de batería', () => {
    render(
      <BarraSistema
        bateriaNivel={85}
        bateriaCargando={true}
        bateriaEstado="cargando"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Batería 85 %, cargando' })
    ).toBeInTheDocument();
  });

  it('despliega y cierra el PanelWifi al pulsar el botón de Wi-Fi y restaura el foco', () => {
    const onWifi = vi.fn();
    render(<BarraSistema onWifi={onWifi} />);

    const botonWifi = screen.getByRole('button', {
      name: 'Wi-Fi, conectado a Casa-5G',
    });

    // Abrir panel
    fireEvent.click(botonWifi);
    expect(onWifi).toHaveBeenCalledOnce();
    expect(screen.getByRole('region', { name: 'Panel de Wi-Fi' })).toBeInTheDocument();

    // Cerrar con Escape y verificar foco
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('region', { name: 'Panel de Wi-Fi' })
    ).not.toBeInTheDocument();
    expect(document.activeElement).toBe(botonWifi);
  });

  it('despliega y cierra el PanelBateria al pulsar el indicador de batería y restaura el foco', () => {
    const onBateria = vi.fn();
    render(<BarraSistema onBateria={onBateria} />);

    const botonBateria = screen.getByRole('button', {
      name: 'Batería 72 %, descargando',
    });

    // Abrir panel
    fireEvent.click(botonBateria);
    expect(onBateria).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('region', { name: 'Panel de batería' })
    ).toBeInTheDocument();

    // Cerrar con Escape y verificar foco
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('region', { name: 'Panel de batería' })
    ).not.toBeInTheDocument();
    expect(document.activeElement).toBe(botonBateria);
  });

  it('muestra "← Escritorio" solo si hay onVolver', () => {
    const { rerender } = render(<BarraSistema />);
    expect(screen.queryByRole('button', { name: '← Escritorio' })).not.toBeInTheDocument();

    rerender(<BarraSistema onVolver={() => undefined} />);
    expect(screen.getByRole('button', { name: '← Escritorio' })).toBeInTheDocument();
  });

  it('despliega el menú de encendido y ejecuta las acciones seleccionadas', () => {
    const onBloquear = vi.fn();
    render(<BarraSistema onBloquear={onBloquear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apagar o reiniciar' }));
    expect(screen.getByRole('menu', { name: 'Menú de encendido' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Bloquear' }));
    expect(onBloquear).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu', { name: 'Menú de encendido' })).not.toBeInTheDocument();
  });

  it('despliega el menú de usuario y ejecuta cambiar de usuario', () => {
    const onCambiarUsuario = vi.fn();
    render(<BarraSistema onCambiarUsuario={onCambiarUsuario} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mia' }));
    expect(screen.getByRole('menu', { name: 'Menú de usuario' })).toBeInTheDocument();

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

  it('muestra la foto de perfil en el botón de usuario y en el menú si existe', () => {
    const usuarioConFoto: Usuario = {
      ...usuarioMia,
      foto: 'data:image/png;base64,foto_mia_barra',
    };
    useSesion.setState({ usuario: usuarioConFoto });

    render(<BarraSistema />);

    const botonUsuario = screen.getByRole('button', { name: 'Mia' });
    const imgUsuario = botonUsuario.querySelector('img');
    expect(imgUsuario).not.toBeNull();
    expect(imgUsuario).toHaveAttribute('src', 'data:image/png;base64,foto_mia_barra');

    // Al abrir el menú de usuario, la cabecera también muestra la foto
    fireEvent.click(botonUsuario);
    const menu = screen.getByRole('menu', { name: 'Menú de usuario' });
    const imgMenu = menu.querySelector('img');
    expect(imgMenu).not.toBeNull();
    expect(imgMenu).toHaveAttribute('src', 'data:image/png;base64,foto_mia_barra');
  });
});
