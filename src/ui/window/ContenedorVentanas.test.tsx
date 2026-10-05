import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContenedorVentanas } from './ContenedorVentanas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';

describe('ContenedorVentanas', () => {
  beforeEach(() => {
    useVentanas.setState({
      ventanas: [],
      focusPid: null,
      _contadorFoco: 0,
    });
    useProcesos.setState({ procesos: [] });
  });

  it('renderiza ventanas abiertas y responde a los controles', () => {
    useVentanas.getState().abrir('focuspad', 1);
    useVentanas.getState().abrir('burble', 2);

    render(<ContenedorVentanas />);

    expect(screen.getByRole('dialog', { name: 'FocusPad' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Burble' })).toBeInTheDocument();
    expect(screen.getByText('Esta app está en construcción')).toBeInTheDocument();

    // Cerrar Burble
    const botonesCerrar = screen.getAllByRole('button', { name: 'Cerrar' });
    fireEvent.click(botonesCerrar[1]);

    expect(screen.queryByRole('dialog', { name: 'Burble' })).not.toBeInTheDocument();
  });
});
