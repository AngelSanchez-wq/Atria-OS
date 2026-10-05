import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FranjaPendientes } from './FranjaPendientes';
import { Tarea } from '../../kernel/types';

describe('FranjaPendientes', () => {
  it('muestra la cantidad correcta de cupos y las tareas', () => {
    const pendientes = [
      { id: '2', titulo: 'Tarea 2', app: 'tagfs' },
      { id: '3', titulo: 'Tarea 3', app: 'timelapse' },
    ] as Tarea[];

    render(<FranjaPendientes pendientes={pendientes} maximo={3} />);
    
    // 2 pendientes + 1 activa = 3
    expect(screen.getByText('Cupos 3 de 3')).toBeInTheDocument();
    expect(screen.getByText(/Tarea 2/)).toBeInTheDocument();
    expect(screen.getByText(/Tarea 3/)).toBeInTheDocument();
  });
});
