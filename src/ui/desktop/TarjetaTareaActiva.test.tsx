import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TarjetaTareaActiva } from './TarjetaTareaActiva';
import { Tarea } from '../../kernel/types';

describe('TarjetaTareaActiva', () => {
  const tareaMock: Tarea = {
    id: 't1',
    titulo: 'Escribir borrador',
    app: 'focuspad',
    minutos: 10,
    etiqueta: 'codigo',
  };

  it('muestra la información correcta en curso', () => {
    render(
      <TarjetaTareaActiva
        tarea={tareaMock}
        estado="en-curso"
        segundosTranscurridos={300}
        onPausar={vi.fn()}
        onReanudar={vi.fn()}
        onTerminar={vi.fn()}
      />
    );
    
    expect(screen.getByText('Escribir borrador')).toBeInTheDocument();
    // 300s = 05:00. 10m = 10:00
    expect(screen.getByText(/FocusPad · En curso · 05:00 de 10:00 · #codigo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
  });

  it('muestra la información correcta pausada', () => {
    const onReanudar = vi.fn();
    render(
      <TarjetaTareaActiva
        tarea={tareaMock}
        estado="pausada"
        segundosTranscurridos={300}
        onPausar={vi.fn()}
        onReanudar={onReanudar}
        onTerminar={vi.fn()}
      />
    );
    
    expect(screen.getByText(/En pausa/)).toBeInTheDocument();
    const btnReanudar = screen.getByRole('button', { name: 'Reanudar' });
    fireEvent.click(btnReanudar);
    expect(onReanudar).toHaveBeenCalledOnce();
  });
});
