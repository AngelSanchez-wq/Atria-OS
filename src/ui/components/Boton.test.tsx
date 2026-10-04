import { fireEvent, render, screen } from '@testing-library/react';
import { Boton } from './Boton';

describe('Boton', () => {
  it('muestra el texto y responde al clic', () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick}>Entrar</Boton>);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no dispara clic cuando está deshabilitado', () => {
    const onClick = vi.fn();
    render(
      <Boton deshabilitado onClick={onClick}>
        Entrar
      </Boton>,
    );

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
