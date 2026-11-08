import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorSegmentado } from './SelectorSegmentado';

describe('SelectorSegmentado', () => {
  const opciones = [
    { valor: 'estandar', etiqueta: 'Estándar' },
    { valor: 'admin', etiqueta: 'Administrador' },
  ] as const;

  it('renderiza radiogroup con las opciones y marca la seleccionada', () => {
    const onSeleccionar = vi.fn();
    render(
      <SelectorSegmentado
        opciones={opciones}
        valorSeleccionado="estandar"
        onSeleccionar={onSeleccionar}
        ariaLabel="Rol de usuario"
      />
    );

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rol de usuario' });
    expect(radiogroup).toBeInTheDocument();

    const optEstandar = screen.getByRole('radio', { name: 'Estándar' });
    const optAdmin = screen.getByRole('radio', { name: 'Administrador' });

    expect(optEstandar).toHaveAttribute('aria-checked', 'true');
    expect(optAdmin).toHaveAttribute('aria-checked', 'false');
  });

  it('permite cambiar la selección mediante clic', () => {
    const onSeleccionar = vi.fn();
    render(
      <SelectorSegmentado
        opciones={opciones}
        valorSeleccionado="estandar"
        onSeleccionar={onSeleccionar}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Administrador' }));
    expect(onSeleccionar).toHaveBeenCalledWith('admin');
  });

  it('navega con flechas del teclado', () => {
    const onSeleccionar = vi.fn();
    render(
      <SelectorSegmentado
        opciones={opciones}
        valorSeleccionado="estandar"
        onSeleccionar={onSeleccionar}
      />
    );

    const radiogroup = screen.getByRole('radiogroup');
    fireEvent.keyDown(radiogroup, { key: 'ArrowRight' });
    expect(onSeleccionar).toHaveBeenCalledWith('admin');
  });
});
