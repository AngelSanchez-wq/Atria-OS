import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnilloSegmentado } from './AnilloSegmentado';
import { SegmentoRevision } from '../../kernel/types';

describe('AnilloSegmentado', () => {
  it('expone atributos de accesibilidad como progressbar con aria-label informativo', () => {
    const segmentos: SegmentoRevision[] = [
      { id: '1', estado: 'revisada' },
      { id: '2', estado: 'revisada' },
      { id: '3', estado: 'actual' },
      { id: '4', estado: 'pospuesta' },
      { id: '5', estado: 'pendiente' },
    ];

    render(
      <AnilloSegmentado segmentos={segmentos} total={5} revisadas={2} pospuestas={1}>
        <span>3/5</span>
      </AnilloSegmentado>
    );

    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuemin', '0');
    expect(barra).toHaveAttribute('aria-valuemax', '5');
    expect(barra).toHaveAttribute('aria-valuenow', '2');
    expect(barra).toHaveAttribute(
      'aria-label',
      '2 de 5 revisadas, 1 para más tarde'
    );
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('renderiza arcos segmentados cuando hay 12 o menos elementos', () => {
    const segmentos: SegmentoRevision[] = [
      { id: '1', estado: 'revisada' },
      { id: '2', estado: 'actual' },
      { id: '3', estado: 'pendiente-urgente' },
      { id: '4', estado: 'pospuesta' },
      { id: '5', estado: 'pendiente' },
    ];

    const { container } = render(<AnilloSegmentado segmentos={segmentos} />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(5);

    // Revisada -> stroke-accent
    expect(paths[0]).toHaveClass('stroke-accent');

    // Actual -> stroke-accent-strong y trazo más grueso
    expect(paths[1]).toHaveClass('stroke-accent-strong');
    expect(paths[1]).toHaveAttribute('stroke-width', '17');

    // Pendiente urgente -> stroke-warm-line
    expect(paths[2]).toHaveClass('stroke-warm-line');

    // Pospuesta -> stroke-accent con trazo punteado (stroke-dasharray)
    expect(paths[3]).toHaveClass('stroke-accent');
    expect(paths[3]).toHaveAttribute('stroke-dasharray', '5 4');

    // Pendiente -> stroke-line
    expect(paths[4]).toHaveClass('stroke-line');
  });

  it('pasa a modo continuo cuando hay más de 12 segmentos', () => {
    const segmentos: SegmentoRevision[] = Array.from({ length: 15 }, (_, i) => ({
      id: `s-${i}`,
      estado: i < 5 ? 'revisada' : 'pendiente',
    }));

    const { container } = render(
      <AnilloSegmentado segmentos={segmentos} total={15} revisadas={5} />
    );

    // En modo continuo no hay paths individuales de segmentos, sino círculos de pista y progreso
    expect(container.querySelectorAll('path')).toHaveLength(0);
    const circulos = container.querySelectorAll('circle');
    expect(circulos.length).toBeGreaterThanOrEqual(2); // Pista base y arco de progreso
  });

  it('renderiza el contenido central proporcionado como children', () => {
    render(
      <AnilloSegmentado segmentos={[]}>
        <div data-testid="centro-personalizado">Búho o texto</div>
      </AnilloSegmentado>
    );

    expect(screen.getByTestId('centro-personalizado')).toBeInTheDocument();
  });
});

/**
 * NOTA: Dado que jsdom no calcula layout real ni container queries (cqmin, cqw),
 * las dimensiones responsivas y el escalado fluido en pantallas maximizadas
 * deben verificarse visualmente en el navegador.
 */
