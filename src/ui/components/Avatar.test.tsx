import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('muestra el nombre y la inicial, y avisa al seleccionarlo', () => {
    const onSeleccionar = vi.fn();

    render(
      <Avatar
        nombre="Mia"
        inicial="M"
        seleccionado={false}
        onSeleccionar={onSeleccionar}
      />
    );

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mia' })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Mia' }));
    expect(onSeleccionar).toHaveBeenCalledTimes(1);
  });

  it('marca el avatar seleccionado', () => {
    render(
      <Avatar
        nombre="Admin"
        inicial="A"
        seleccionado
        esAdmin
        onSeleccionar={() => undefined}
      />
    );

    expect(screen.getByRole('radio', { name: 'Admin' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('muestra el avatar atenuado y con distintivo cuando está bloqueado', () => {
    const { container } = render(
      <Avatar
        nombre="Mateo"
        inicial="M"
        seleccionado={false}
        bloqueado={true}
        onSeleccionar={() => undefined}
      />
    );

    // Contiene la clase de atenuación
    const circulo = container.querySelector('.opacity-60');
    expect(circulo).toBeInTheDocument();

    // Contiene el ícono de candado (svg de lucide-react)
    const svgCandado = container.querySelector('svg');
    expect(svgCandado).toBeInTheDocument();
  });

  it('muestra la imagen en círculo si se proporciona', () => {
    render(
      <Avatar
        nombre="Valery"
        inicial="V"
        imagen="data:image/png;base64,mock"
        seleccionado={false}
        onSeleccionar={() => undefined}
      />
    );

    const img = screen.getByRole('img', { name: 'Valery' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,mock');
    expect(screen.queryByText('V')).not.toBeInTheDocument();
  });
});
