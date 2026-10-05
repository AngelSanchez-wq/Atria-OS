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

  it('muestra el punto de app abierta y la etiqueta aria correspondiente', () => {
    render(
      <Dock
        appsAbiertas={['focuspad', 'timelapse']}
        appEnfocada="focuspad"
        onAbrirApp={vi.fn()}
      />
    );

    const botonAbierta = screen.getByRole('button', { name: 'FocusPad, abierta' });
    expect(botonAbierta).toBeInTheDocument();
    expect(botonAbierta.className).toContain('bg-soft');

    const botonCerrada = screen.getByRole('button', { name: 'TagFS' });
    expect(botonCerrada).toBeInTheDocument();
  });
});
