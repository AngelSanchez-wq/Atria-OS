import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuEncendido } from './MenuEncendido';

describe('MenuEncendido', () => {
  it('muestra las opciones y llama a los callbacks correspondientes', () => {
    const onCerrar = vi.fn();
    const onBloquear = vi.fn();
    const onSuspender = vi.fn();
    const onReiniciar = vi.fn();
    const onApagar = vi.fn();

    render(
      <MenuEncendido
        abierto={true}
        onCerrar={onCerrar}
        onBloquear={onBloquear}
        onSuspender={onSuspender}
        onReiniciar={onReiniciar}
        onApagar={onApagar}
      />
    );

    expect(screen.getByRole('menu', { name: 'Menú de encendido' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Bloquear' }));
    expect(onBloquear).toHaveBeenCalledOnce();
    expect(onCerrar).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Suspender' }));
    expect(onSuspender).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Reiniciar' }));
    expect(onReiniciar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    expect(onApagar).toHaveBeenCalledOnce();
  });

  it('se cierra al presionar Escape', () => {
    const onCerrar = vi.fn();
    render(
      <MenuEncendido
        abierto={true}
        onCerrar={onCerrar}
        onBloquear={vi.fn()}
        onSuspender={vi.fn()}
        onReiniciar={vi.fn()}
        onApagar={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledOnce();
  });
});
