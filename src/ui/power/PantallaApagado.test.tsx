import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PantallaApagado } from './PantallaApagado';

describe('PantallaApagado', () => {
  it('muestra el botón de Encender y responde al clic', () => {
    const onEncender = vi.fn();
    render(<PantallaApagado onEncender={onEncender} />);

    expect(screen.getByText('Atria-OS está apagado')).toBeInTheDocument();

    const boton = screen.getByRole('button', { name: /Encender/i });
    expect(boton).toBeInTheDocument();

    fireEvent.click(boton);
    expect(onEncender).toHaveBeenCalledOnce();
  });
});
