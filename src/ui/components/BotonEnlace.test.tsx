import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BotonEnlace } from './BotonEnlace';

describe('BotonEnlace', () => {
  it('se renderiza y reacciona al clic', () => {
    const fnClic = vi.fn();
    render(<BotonEnlace onClick={fnClic}>Probar Enlace</BotonEnlace>);
    
    const boton = screen.getByRole('button', { name: 'Probar Enlace' });
    expect(boton).toBeInTheDocument();
    
    fireEvent.click(boton);
    expect(fnClic).toHaveBeenCalledOnce();
  });
});
