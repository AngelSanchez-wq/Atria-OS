import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renderiza el contenido y responde a clics', () => {
    const alPulsar = vi.fn();
    render(<Chip onClick={alPulsar}>Sesiones</Chip>);

    const boton = screen.getByRole('button', { name: 'Sesiones' });
    expect(boton).toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(boton);
    expect(alPulsar).toHaveBeenCalledOnce();
  });

  it('aplica estilos activos cuando activo es true', () => {
    render(<Chip activo={true}>Todo</Chip>);

    const boton = screen.getByRole('button', { name: 'Todo' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    expect(boton.className).toContain('bg-accent');
    expect(boton.className).toContain('text-bg');
  });

  it('aplica estilos inactivos cuando activo es false', () => {
    render(<Chip activo={false}>Seguridad</Chip>);

    const boton = screen.getByRole('button', { name: 'Seguridad' });
    expect(boton).toHaveAttribute('aria-pressed', 'false');
    expect(boton.className).toContain('border-line');
    expect(boton.className).toContain('text-muted');
  });
});
