import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PildoraEstado } from './PildoraEstado';

describe('PildoraEstado', () => {
  it('renderiza el texto del estado con las clases apropiadas', () => {
    render(<PildoraEstado estado="En ejecución" />);
    const pildora = screen.getByText('En ejecución');
    expect(pildora).toBeInTheDocument();
    expect(pildora.className).toContain('bg-soft');
  });

  it('renderiza el estado Bloqueado con colores cálidos', () => {
    render(<PildoraEstado estado="Bloqueado" />);
    const pildora = screen.getByText('Bloqueado');
    expect(pildora.className).toContain('bg-warm');
  });
});
