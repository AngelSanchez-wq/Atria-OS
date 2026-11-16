import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FranjaPendientes } from './FranjaPendientes';
import { Tarea } from '../../kernel/types';

describe('FranjaPendientes', () => {
  it('muestra la cantidad correcta de cupos, marca importante y botón Nueva tarea', () => {
    const onNuevaTarea = vi.fn();
    const pendientes = [
      { id: '2', titulo: 'Tarea 2', app: 'tagfs', importante: true },
      { id: '3', titulo: 'Tarea 3', app: 'timelapse' },
    ] as Tarea[];

    render(
      <FranjaPendientes
        pendientes={pendientes}
        maximo={3}
        onNuevaTarea={onNuevaTarea}
      />
    );

    // 2 pendientes + 1 activa = 3
    expect(screen.getByText('Cupos 3 de 3')).toBeInTheDocument();
    expect(screen.getByText(/Tarea 2/)).toBeInTheDocument();
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText(/Tarea 3/)).toBeInTheDocument();

    const btnNueva = screen.getByRole('button', { name: 'Nueva tarea' });
    fireEvent.click(btnNueva);
    expect(onNuevaTarea).toHaveBeenCalledTimes(1);
  });
});
