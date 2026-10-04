import { render, screen } from '@testing-library/react';
import { BarraProgreso } from './BarraProgreso';

describe('BarraProgreso', () => {
  it('expone el rol progressbar con valores aria', () => {
    render(
      <BarraProgreso valor={40} color="acento" etiqueta="Iniciando el sistema" />,
    );

    const barra = screen.getByRole('progressbar', { name: 'Iniciando el sistema' });
    expect(barra).toHaveAttribute('aria-valuenow', '40');
    expect(barra).toHaveAttribute('aria-valuemin', '0');
    expect(barra).toHaveAttribute('aria-valuemax', '100');
  });

  it('limita el valor entre 0 y 100', () => {
    const { rerender } = render(
      <BarraProgreso valor={-10} color="calido" etiqueta="Progreso" />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    rerender(<BarraProgreso valor={150} color="calido" etiqueta="Progreso" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
