import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BotonSonido } from './BotonSonido';
import { SONIDOS_AMBIENT } from './sonidos';

describe('BotonSonido', () => {
  const sonidoLluvia = SONIDOS_AMBIENT[0];

  it('muestra estado inactivo con aria-pressed false y estilo atenuado', () => {
    const onClick = vi.fn();
    render(<BotonSonido sonido={sonidoLluvia} activo={false} onClick={onClick} />);

    const boton = screen.getByRole('button', { name: 'Lluvia' });
    expect(boton).toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-pressed', 'false');
    expect(boton.className).toContain('text-muted');

    fireEvent.click(boton);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('muestra estado activo con aria-pressed true, borde de acento y fondo suave', () => {
    render(<BotonSonido sonido={sonidoLluvia} activo={true} onClick={vi.fn()} />);

    const boton = screen.getByRole('button', { name: /Lluvia, activo/i });
    expect(boton).toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    expect(boton.className).toContain('border-2 border-accent');
    expect(boton.className).toContain('bg-soft');
    expect(boton.className).toContain('text-accent-strong');
  });
});
