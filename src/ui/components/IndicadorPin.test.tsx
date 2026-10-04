import { render, screen } from '@testing-library/react';
import { IndicadorPin } from './IndicadorPin';

describe('IndicadorPin', () => {
  it('anuncia cuántos dígitos hay ingresados', () => {
    render(<IndicadorPin digitosIngresados={2} totalDigitos={4} />);

    expect(screen.getByRole('status', { name: '2 de 4 dígitos' })).toBeInTheDocument();
  });

  it('limita el anuncio al total de dígitos', () => {
    render(<IndicadorPin digitosIngresados={9} totalDigitos={4} />);

    expect(screen.getByRole('status', { name: '4 de 4 dígitos' })).toBeInTheDocument();
  });
});
