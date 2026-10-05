import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dock } from './Dock';

describe('Dock', () => {
  it('muestra las aplicaciones y permite abrir una', () => {
    const onAbrir = vi.fn();
    render(<Dock onAbrirApp={onAbrir} />);
    
    const nav = screen.getByRole('navigation', { name: 'Aplicaciones' });
    expect(nav).toBeInTheDocument();

    const botonFocus = screen.getByRole('button', { name: 'FocusPad' });
    fireEvent.click(botonFocus);
    expect(onAbrir).toHaveBeenCalledWith('focuspad');
  });

  it('resalta la app activa', () => {
    render(<Dock appActiva="timelapse" onAbrirApp={vi.fn()} />);
    const boton = screen.getByRole('button', { name: 'TimeLapse' });
    // Verificamos por la clase o estructura interna
    expect(boton.className).toContain('bg-soft');
  });
});
