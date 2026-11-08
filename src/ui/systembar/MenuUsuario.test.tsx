import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuUsuario } from './MenuUsuario';
import { useSesion } from '../../store/sesion';

describe('MenuUsuario', () => {
  beforeEach(() => {
    useSesion.setState({
      usuario: {
        id: 'mateo',
        nombre: 'Mateo',
        inicial: 'M',
        rol: 'estandar',
        pin: '5678',
      },
    });
  });

  it('muestra los datos del usuario y permite cambiar de usuario o cerrar sesión', () => {
    const onCerrar = vi.fn();
    const onCambiarUsuario = vi.fn();
    const onCerrarSesion = vi.fn();

    render(
      <MenuUsuario
        abierto={true}
        onCerrar={onCerrar}
        onCambiarUsuario={onCambiarUsuario}
        onCerrarSesion={onCerrarSesion}
      />
    );

    expect(screen.getByText('Mateo')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cambiar de usuario' }));
    expect(onCambiarUsuario).toHaveBeenCalledOnce();
    expect(onCerrar).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(onCerrarSesion).toHaveBeenCalledOnce();
  });

  it('se cierra al pulsar Escape', () => {
    const onCerrar = vi.fn();
    render(
      <MenuUsuario
        abierto={true}
        onCerrar={onCerrar}
        onCambiarUsuario={vi.fn()}
        onCerrarSesion={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledOnce();
  });

  it('muestra la opción Configuración y llama a onAbrirConfiguracion', () => {
    const onCerrar = vi.fn();
    const onAbrirConfiguracion = vi.fn();

    render(
      <MenuUsuario
        abierto={true}
        onCerrar={onCerrar}
        onCambiarUsuario={vi.fn()}
        onCerrarSesion={vi.fn()}
        onAbrirConfiguracion={onAbrirConfiguracion}
      />
    );

    const botonConfiguracion = screen.getByRole('menuitem', {
      name: 'Configuración',
    });
    expect(botonConfiguracion).toBeInTheDocument();

    fireEvent.click(botonConfiguracion);
    expect(onAbrirConfiguracion).toHaveBeenCalledOnce();
    expect(onCerrar).toHaveBeenCalled();
  });
});
