import { render, screen } from '@testing-library/react';
import { Buho } from './Buho';

describe('Buho', () => {
  it('muestra la imagen de reposo con texto alternativo', () => {
    render(<Buho estado="reposo" tamano={96} />);

    const imagen = screen.getByRole('img', { name: 'Búho en reposo' });
    expect(imagen).toHaveAttribute(
      'src',
      expect.stringContaining('images/buho-reposo.png'),
    );
  });

  it('elige la imagen según el estado', () => {
    const { rerender } = render(<Buho estado="foco" tamano={64} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('images/buho-foco.png'),
    );

    rerender(<Buho estado="logro" tamano={64} />);
    expect(screen.getByRole('img', { name: 'Búho celebrando un logro' })).toHaveAttribute(
      'src',
      expect.stringContaining('images/buho-logro.png'),
    );
  });
});
