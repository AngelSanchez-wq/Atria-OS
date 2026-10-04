import { fireEvent, render, screen } from '@testing-library/react';
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
      />,
    );

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mia' })).toHaveAttribute(
      'aria-checked',
      'false',
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
      />,
    );

    expect(screen.getByRole('radio', { name: 'Admin' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
