import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TarjetaTarea } from './TarjetaTarea';
import { Tarea } from '../../kernel/types';

describe('TarjetaTarea', () => {
  const tareaMock: Tarea = {
    id: 't1',
    titulo: 'Mi tarea de prueba',
    app: 'focuspad',
    minutos: 25,
    etiqueta: 'codigo',
  };

  it('muestra el título, app, minutos y etiqueta', () => {
    render(<TarjetaTarea tarea={tareaMock} />);
    
    expect(screen.getByRole('heading', { name: 'Mi tarea de prueba' })).toBeInTheDocument();
    
    // Verifica el subtítulo
    expect(screen.getByText(/FocusPad/)).toBeInTheDocument();
    expect(screen.getByText(/25 min/)).toBeInTheDocument();
    expect(screen.getByText(/#codigo/)).toBeInTheDocument();
  });

  it('tiene la etiqueta aria correcta', () => {
    render(<TarjetaTarea tarea={tareaMock} />);
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Sugerencia: Mi tarea de prueba');
  });
});
