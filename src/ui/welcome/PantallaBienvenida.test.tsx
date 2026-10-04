import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaBienvenida } from './PantallaBienvenida';
import { useSesion } from '../../store/sesion';
import { TAREAS_SEMILLA } from '../../kernel/tasks/tareas-semilla';

// Mock del store de sesión
vi.mock('../../store/sesion', () => ({
  useSesion: vi.fn(),
}));

// Mock de BarraSistema para no renderizar su complejidad
vi.mock('../systembar/BarraSistema', () => ({
  BarraSistema: () => <div data-testid="barra-sistema" />,
}));

describe('PantallaBienvenida', () => {
  it('saluda al usuario y muestra la primera tarea', () => {
    vi.mocked(useSesion).mockReturnValue({ nombre: 'Mateo' });
    
    render(<PantallaBienvenida onEmpezar={vi.fn()} />);
    
    expect(screen.getByText('Hola, Mateo')).toBeInTheDocument();
    expect(screen.getByText(TAREAS_SEMILLA[0].titulo)).toBeInTheDocument();
  });

  it('cambia de sugerencia al hacer clic en Otra sugerencia', () => {
    vi.mocked(useSesion).mockReturnValue({ nombre: 'Mateo' });
    
    render(<PantallaBienvenida onEmpezar={vi.fn()} />);
    
    expect(screen.getByText(TAREAS_SEMILLA[0].titulo)).toBeInTheDocument();
    
    const btnOtra = screen.getByRole('button', { name: 'Otra sugerencia' });
    
    act(() => {
      fireEvent.click(btnOtra);
    });
    
    expect(screen.getByText(TAREAS_SEMILLA[1].titulo)).toBeInTheDocument();
  });

  it('llama a onEmpezar con la tarea mostrada', () => {
    vi.mocked(useSesion).mockReturnValue({ nombre: 'Valery' });
    const mockEmpezar = vi.fn();
    
    render(<PantallaBienvenida onEmpezar={mockEmpezar} />);
    
    const btnEmpezar = screen.getByRole('button', { name: 'Empezar' });
    
    act(() => {
      fireEvent.click(btnEmpezar);
    });
    
    expect(mockEmpezar).toHaveBeenCalledWith(TAREAS_SEMILLA[0]);
  });
});
