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

  it('comparte la misma estructura de centrado y borde de 2px en todas las variantes', () => {
    const { rerender } = render(<Boton variante="principal">Entendido</Boton>);
    const botonPrincipal = screen.getByRole('button', { name: 'Entendido' });

    // Estructura de centrado uniforme sin padding vertical dependiente de altura de línea
    expect(botonPrincipal).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'box-border',
      'min-h-[44px]',
      'leading-none',
      'text-center',
      'font-sans',
      'font-semibold',
      'border-2',
      'border-transparent'
    );

    rerender(<Boton variante="secundario">Más tarde</Boton>);
    const botonSecundario = screen.getByRole('button', { name: 'Más tarde' });

    expect(botonSecundario).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'box-border',
      'min-h-[44px]',
      'leading-none',
      'text-center',
      'font-sans',
      'font-semibold',
      'border-2',
      'border-line'
    );
  });
});

/**
 * NOTA: Dado que jsdom no calcula layout real ni métricas de fuentes,
 * el centrado vertical exacto de la línea base debe verificarse visualmente en el navegador.
 */
