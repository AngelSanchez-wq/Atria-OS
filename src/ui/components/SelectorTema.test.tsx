import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorTema } from './SelectorTema';
import { useTema } from '../../store/tema';

describe('SelectorTema', () => {
  beforeEach(() => {
    localStorage.clear();
    useTema.getState().setPreferencia('claro');
  });

  it('muestra las 3 opciones de tema y cambia la selección al hacer clic', () => {
    render(<SelectorTema />);

    expect(screen.getByRole('radiogroup', { name: 'Seleccionar tema' })).toBeInTheDocument();

    const radioOscuro = screen.getByRole('radio', { name: 'Oscuro' });
    expect(radioOscuro).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(radioOscuro);
    expect(radioOscuro).toHaveAttribute('aria-checked', 'true');
    expect(useTema.getState().preferencia).toBe('oscuro');
  });

  it('permite navegar con flechas del teclado', () => {
    render(<SelectorTema />);

    const radioClaro = screen.getByRole('radio', { name: 'Claro' });
    fireEvent.keyDown(radioClaro, { key: 'ArrowRight' });

    expect(useTema.getState().preferencia).toBe('oscuro');
  });
});
