import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TarjetaResumen } from './TarjetaResumen';

describe('TarjetaResumen', () => {
  it('muestra el título, valor principal y subtítulo', () => {
    render(
      <TarjetaResumen
        titulo="Procesos activos"
        valorPrincipal={3}
        subtitulo="total"
      />
    );

    expect(screen.getByText('Procesos activos')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
  });
});
