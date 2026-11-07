import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlVolumen } from './ControlVolumen';

describe('ControlVolumen', () => {
  it('renderiza el control de volumen accesible con sus atributos aria', () => {
    const onCambiar = vi.fn();
    render(<ControlVolumen volumen={0.5} onCambiarVolumen={onCambiar} />);

    const slider = screen.getByRole('slider', { name: 'Volumen' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '50%');

    fireEvent.change(slider, { target: { value: '0.8' } });
    expect(onCambiar).toHaveBeenCalledWith(0.8);
  });
});
