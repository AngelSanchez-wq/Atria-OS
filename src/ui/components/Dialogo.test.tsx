import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialogo } from './Dialogo';

describe('Dialogo', () => {
  it('renderiza cuando está abierto y dispara los eventos', () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <Dialogo
        abierto={true}
        titulo="¿Terminar proceso?"
        mensaje="Se cerrará su ventana."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('¿Terminar proceso?')).toBeInTheDocument();
    expect(screen.getByText('Se cerrará su ventana.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancelar).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it('se cancela al presionar Escape', () => {
    const onCancelar = vi.fn();

    render(
      <Dialogo
        abierto={true}
        titulo="Alerta"
        mensaje="Mensaje de prueba"
        onConfirmar={vi.fn()}
        onCancelar={onCancelar}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it('no renderiza cuando abierto es false', () => {
    render(
      <Dialogo
        abierto={false}
        titulo="Alerta"
        mensaje="Mensaje"
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      />
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
