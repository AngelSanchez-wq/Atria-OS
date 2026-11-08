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

  it('renderiza la píldora de aviso con colores cálidos y texto por defecto', () => {
    render(<PildoraEstado gravedad="aviso" />);
    const pildora = screen.getByText('Aviso');
    expect(pildora).toBeInTheDocument();
    expect(pildora.className).toContain('bg-warm');
    expect(pildora.className).toContain('text-warm-ink');
  });
});
