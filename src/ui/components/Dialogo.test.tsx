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

  it('mantiene el foco en el botón Confirmar tras 3000 ms y con re-renders de callbacks', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <Dialogo
        abierto={true}
        titulo="Confirmación"
        mensaje="¿Proceder?"
        onConfirmar={vi.fn()}
        onCancelar={() => undefined}
      />
    );

    const btnConfirmar = screen.getByRole('button', { name: 'Terminar' });
    btnConfirmar.focus();
    expect(document.activeElement).toBe(btnConfirmar);

    // Re-renderizar con una nueva función inline de onCancelar (simula re-render periódico del padre)
    rerender(
      <Dialogo
        abierto={true}
        titulo="Confirmación"
        mensaje="¿Proceder?"
        onConfirmar={vi.fn()}
        onCancelar={() => undefined}
      />
    );

    // Avanzar 3000 ms
    vi.advanceTimersByTime(3000);

    // El foco no debe haber sido robado a Cancelar
    expect(document.activeElement).toBe(btnConfirmar);

    vi.useRealTimers();
  });

  it('atrapa el foco cíclicamente entre Cancelar y Confirmar con Tab y Shift+Tab', () => {
    render(
      <Dialogo
        abierto={true}
        titulo="Alerta"
        mensaje="Mensaje"
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      />
    );

    const dialogo = screen.getByRole('alertdialog');
    const btnCancelar = screen.getByRole('button', { name: 'Cancelar' });
    const btnTerminar = screen.getByRole('button', { name: 'Terminar' });

    // Foco inicial en Cancelar
    expect(document.activeElement).toBe(btnCancelar);

    // Tab en el último elemento (Terminar) cicla a Cancelar
    btnTerminar.focus();
    expect(document.activeElement).toBe(btnTerminar);
    fireEvent.keyDown(dialogo, { key: 'Tab' });
    expect(document.activeElement).toBe(btnCancelar);

    // Shift+Tab en el primer elemento (Cancelar) cicla a Terminar
    btnCancelar.focus();
    expect(document.activeElement).toBe(btnCancelar);
    fireEvent.keyDown(dialogo, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btnTerminar);
  });
});
