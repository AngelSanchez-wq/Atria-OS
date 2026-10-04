import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IconoApp } from './IconoApp';

describe('IconoApp', () => {
  it('muestra la imagen con la ruta correcta (usando BASE_URL omitido en test o "/")', () => {
    render(<IconoApp app="focuspad" size={32} />);
    const img = screen.getByRole('presentation', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('icons/focuspad.svg');
    expect(img.getAttribute('width')).toBe('32');
  });

  it('usa texto alternativo si no es decorativo', () => {
    render(<IconoApp app="timelapse" decorativo={false} />);
    const img = screen.getByAltText('TimeLapse');
    expect(img).toBeInTheDocument();
  });
});
