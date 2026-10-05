import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarraTitulo } from './BarraTitulo';

describe('BarraTitulo', () => {
  it('muestra el nombre de la app y dispara los callbacks de control', () => {
    const onMinimizar = vi.fn();
    const onMaximizar = vi.fn();
    const onCerrar = vi.fn();

    render(
      <BarraTitulo
        appId="focuspad"
        maximizada={false}
        onMinimizar={onMinimizar}
        onMaximizar={onMaximizar}
        onCerrar={onCerrar}
      />
    );

    expect(screen.getByText('FocusPad')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Minimizar' }));
    expect(onMinimizar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Maximizar' }));
    expect(onMaximizar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onCerrar).toHaveBeenCalledOnce();

    const linkPestana = screen.getByRole('link', { name: 'Abrir en pestaña nueva' });
    expect(linkPestana).toHaveAttribute('href', 'https://zenpen.io/');
  });

  it('muestra el texto de Restaurar cuando está maximizada', () => {
    render(
      <BarraTitulo
        appId="ambient"
        maximizada={true}
        onMinimizar={vi.fn()}
        onMaximizar={vi.fn()}
        onCerrar={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
    // Ambient es interna, no tiene enlace a pestaña externa
    expect(screen.queryByRole('link', { name: 'Abrir en pestaña nueva' })).not.toBeInTheDocument();
  });
});
