import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorSegmentado, OpcionSegmentada } from './SelectorSegmentado';

const OPCIONES: OpcionSegmentada[] = [
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'grande', etiqueta: 'Grande' },
  { id: 'muy-grande', etiqueta: 'Muy grande' },
];

describe('SelectorSegmentado', () => {
  it('renderiza con role radiogroup y las opciones con role radio', () => {
    render(
      <SelectorSegmentado
        opciones={OPCIONES}
        valorActual="normal"
        onSeleccionar={vi.fn()}
        etiquetaAria="Tamaño de texto"
      />
    );

    const radiogroup = screen.getByRole('radiogroup', {
      name: 'Tamaño de texto',
    });
    expect(radiogroup).toBeInTheDocument();

    const radioNormal = screen.getByRole('radio', { name: 'Normal' });
    const radioGrande = screen.getByRole('radio', { name: 'Grande' });
    const radioMuyGrande = screen.getByRole('radio', { name: 'Muy grande' });

    expect(radioNormal).toHaveAttribute('aria-checked', 'true');
    expect(radioGrande).toHaveAttribute('aria-checked', 'false');
    expect(radioMuyGrande).toHaveAttribute('aria-checked', 'false');
  });

  it('llama a onSeleccionar al hacer clic en una opción', () => {
    const onSeleccionar = vi.fn();
    render(
      <SelectorSegmentado
        opciones={OPCIONES}
        valorActual="normal"
        onSeleccionar={onSeleccionar}
        etiquetaAria="Tamaño de texto"
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Grande' }));
    expect(onSeleccionar).toHaveBeenCalledWith('grande');
  });

  it('permite navegar cíclicamente con las flechas del teclado', () => {
    const onSeleccionar = vi.fn();
    render(
      <SelectorSegmentado
        opciones={OPCIONES}
        valorActual="normal"
        onSeleccionar={onSeleccionar}
        etiquetaAria="Tamaño de texto"
      />
    );

    const radioNormal = screen.getByRole('radio', { name: 'Normal' });

    // Flecha derecha avanza a 'grande'
    fireEvent.keyDown(radioNormal, { key: 'ArrowRight' });
    expect(onSeleccionar).toHaveBeenCalledWith('grande');

    // Flecha izquierda retrocede a 'muy-grande' (cíclico)
    fireEvent.keyDown(radioNormal, { key: 'ArrowLeft' });
    expect(onSeleccionar).toHaveBeenCalledWith('muy-grande');
  });
});
