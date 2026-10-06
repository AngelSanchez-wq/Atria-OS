import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContenedorVentanas } from './ContenedorVentanas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';

describe('ContenedorVentanas', () => {
  beforeEach(() => {
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
    });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
  });

  it('renderiza ventanas abiertas, incluyendo el monitor de procesos', () => {
    useVentanas.getState().abrir('monitor', 2);
    useVentanas.getState().abrir('burble', 3);

    render(<ContenedorVentanas />);

    expect(screen.getByRole('dialog', { name: 'Monitor de procesos' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Monitor de procesos' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Burble' })).toBeInTheDocument();
    expect(screen.getByText('Esta app está en construcción')).toBeInTheDocument();

    // Cerrar Burble
    const botonesCerrar = screen.getAllByRole('button', { name: 'Cerrar' });
    fireEvent.click(botonesCerrar[1]);

    expect(screen.queryByRole('dialog', { name: 'Burble' })).not.toBeInTheDocument();
  });
});
