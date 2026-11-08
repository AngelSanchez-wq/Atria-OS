import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Interruptor } from './Interruptor';

describe('Interruptor', () => {
  it('renderiza con role switch y aria-checked correspondiente', () => {
    const { rerender } = render(
      <Interruptor activo={false} onAlternar={vi.fn()} etiqueta="Modo prueba" />
    );

    const elSwitch = screen.getByRole('switch', { name: 'Modo prueba' });
    expect(elSwitch).toBeInTheDocument();
    expect(elSwitch).toHaveAttribute('aria-checked', 'false');

    rerender(
      <Interruptor activo={true} onAlternar={vi.fn()} etiqueta="Modo prueba" />
    );
    expect(elSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('llama a onAlternar al hacer clic', () => {
    const onAlternar = vi.fn();
    render(
      <Interruptor activo={false} onAlternar={onAlternar} etiqueta="Prueba" />
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Prueba' }));
    expect(onAlternar).toHaveBeenCalledTimes(1);
  });

  it('permite alternar con las teclas Espacio y Enter', () => {
    const onAlternar = vi.fn();
    render(
      <Interruptor activo={false} onAlternar={onAlternar} etiqueta="Prueba" />
    );

    const elSwitch = screen.getByRole('switch', { name: 'Prueba' });
    fireEvent.keyDown(elSwitch, { key: ' ' });
    expect(onAlternar).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(elSwitch, { key: 'Enter' });
    expect(onAlternar).toHaveBeenCalledTimes(2);
  });

  it('no llama a onAlternar cuando está deshabilitado', () => {
    const onAlternar = vi.fn();
    render(
      <Interruptor
        activo={false}
        onAlternar={onAlternar}
        disabled={true}
        etiqueta="Prueba"
      />
    );

    const elSwitch = screen.getByRole('switch', { name: 'Prueba' });
    fireEvent.click(elSwitch);
    expect(onAlternar).not.toHaveBeenCalled();

    fireEvent.keyDown(elSwitch, { key: ' ' });
    expect(onAlternar).not.toHaveBeenCalled();
  });
});
