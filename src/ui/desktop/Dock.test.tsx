import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dock } from './Dock';
import { useSesion } from '../../store/sesion';

describe('Dock', () => {
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

  it('muestra las aplicaciones estándar y oculta el monitor para usuario estándar', () => {
    const onAbrir = vi.fn();
    render(<Dock onAbrirApp={onAbrir} />);

    expect(screen.getByRole('button', { name: 'FocusPad' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Monitor de procesos' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'FocusPad' }));
    expect(onAbrir).toHaveBeenCalledWith('focuspad');
  });

  it('muestra el monitor de procesos cuando el usuario es administrador', () => {
    useSesion.setState({
      usuario: {
        id: 'admin',
        nombre: 'Admin',
        inicial: 'A',
        rol: 'admin',
        pin: '0000',
      },
    });

    render(<Dock onAbrirApp={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Monitor de procesos' })).toBeInTheDocument();
  });
});
