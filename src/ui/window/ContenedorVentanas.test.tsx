import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContenedorVentanas } from './ContenedorVentanas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { servicioAudio } from '../../system/audio/servicio';

describe('ContenedorVentanas', () => {
  beforeEach(() => {
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
    });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
  });

  it('renderiza ventanas abiertas, incluyendo el monitor de procesos y ambient', () => {
    useVentanas.getState().abrir('monitor', 2);
    useVentanas.getState().abrir('ambient', 3);

    render(<ContenedorVentanas />);

    expect(screen.getByRole('dialog', { name: 'Administración' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Ambient' })).toBeInTheDocument();
    expect(screen.getByText('Sonido de fondo')).toBeInTheDocument();
  });

  it('minimizar la ventana de Ambient no detiene el audio, pero cerrarla sí lo detiene', () => {
    const spyDetener = vi.spyOn(servicioAudio, 'detener');

    useVentanas.getState().abrir('ambient', 2);
    render(<ContenedorVentanas />);

    // Minimizar
    const botonMinimizar = screen.getByRole('button', { name: 'Minimizar' });
    fireEvent.click(botonMinimizar);
    expect(spyDetener).not.toHaveBeenCalled();

    // Cerrar
    const botonCerrar = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(botonCerrar);
    expect(spyDetener).toHaveBeenCalledOnce();
  });
});
