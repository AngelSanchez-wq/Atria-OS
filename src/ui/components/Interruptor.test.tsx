import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Interruptor } from './Interruptor';

describe('Interruptor', () => {
  it('se renderiza con role="switch" y refleja aria-checked', () => {
    const onAlternar = vi.fn();
    render(<Interruptor activo={true} onAlternar={onAlternar} ariaLabel="Habilitar app" />);

    const sw = screen.getByRole('switch', { name: 'Habilitar app' });
    expect(sw).toBeInTheDocument();
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('llama a onAlternar al hacer clic', () => {
    const onAlternar = vi.fn();
    render(<Interruptor activo={false} onAlternar={onAlternar} ariaLabel="Habilitar" />);

    const sw = screen.getByRole('switch', { name: 'Habilitar' });
    fireEvent.click(sw);
    expect(onAlternar).toHaveBeenCalledWith(true);
  });

  it('permite alternar mediante teclado con Espacio y Enter', () => {
    const onAlternar = vi.fn();
    render(<Interruptor activo={true} onAlternar={onAlternar} ariaLabel="Habilitar" />);

    const sw = screen.getByRole('switch', { name: 'Habilitar' });
    fireEvent.keyDown(sw, { key: ' ' });
    expect(onAlternar).toHaveBeenCalledWith(false);

    fireEvent.keyDown(sw, { key: 'Enter' });
    expect(onAlternar).toHaveBeenCalledWith(false);
  });

  it('no permite alternar cuando está deshabilitado', () => {
    const onAlternar = vi.fn();
    render(
      <Interruptor
        activo={false}
        deshabilitado={true}
        onAlternar={onAlternar}
        ariaLabel="Habilitar"
      />
    );

    const sw = screen.getByRole('switch', { name: 'Habilitar' });
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onAlternar).not.toHaveBeenCalled();
  });
});
