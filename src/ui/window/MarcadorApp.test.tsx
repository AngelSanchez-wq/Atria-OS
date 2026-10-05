import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarcadorApp } from './MarcadorApp';

describe('MarcadorApp', () => {
  it('muestra el nombre de la app y el aviso de construcción', () => {
    render(<MarcadorApp appId="burble" />);
    expect(screen.getByText('Burble')).toBeInTheDocument();
    expect(screen.getByText('Esta app está en construcción')).toBeInTheDocument();
  });
});
