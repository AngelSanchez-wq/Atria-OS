import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dock } from './Dock';
import { useSesion } from '../../store/sesion';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

describe('Dock', () => {
  beforeEach(() => {
    useSesion.setState({
      usuario: USUARIOS_SEMILLA[1],
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
      usuario: USUARIOS_SEMILLA[2],
    });

    render(<Dock onAbrirApp={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Monitor de procesos' })).toBeInTheDocument();
  });
});
