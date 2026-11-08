import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PantallaLogro } from './PantallaLogro';
import { Tarea } from '../../kernel/types';

describe('PantallaLogro', () => {
  const tareaMock: Tarea = {
    id: 't1',
    titulo: 'Escribir borrador del informe',
    app: 'focuspad',
    minutos: 15,
    etiqueta: 'estudio',
  };

  const siguienteMock: Tarea = {
    id: 't2',
    titulo: 'Organizar archivos',
    app: 'tagfs',
    minutos: 10,
    etiqueta: 'trabajo',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el título, minutos enfocados y la siguiente tarea', () => {
    render(
      <PantallaLogro
        tareaTerminada={tareaMock}
        segundosTranscurridos={900}
        siguienteTarea={siguienteMock}
        onContinuar={vi.fn()}
      />
    );

    expect(screen.getByText('Tarea completada')).toBeInTheDocument();
    expect(screen.getByText('Escribir borrador del informe')).toBeInTheDocument();
    expect(screen.getByText('15 min enfocada')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tarea completada' })).toBeInTheDocument();

    // Siguiente tarea en la franja
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByText(/Organizar archivos/)).toBeInTheDocument();
  });

  it('omite la franja inferior si no hay tareas siguientes', () => {
    render(
      <PantallaLogro
        tareaTerminada={tareaMock}
        segundosTranscurridos={60}
        siguienteTarea={null}
        onContinuar={vi.fn()}
      />
    );

    expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
  });

  it('vuelve sola a los 3 segundos (DURACION_LOGRO_MS)', async () => {
    const onContinuar = vi.fn();
    render(
      <PantallaLogro
        tareaTerminada={tareaMock}
        segundosTranscurridos={300}
        siguienteTarea={siguienteMock}
        onContinuar={onContinuar}
      />
    );

    expect(onContinuar).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onContinuar).toHaveBeenCalledOnce();
  });

  it('el enlace Continuar la adelanta y no se dispara dos veces', async () => {
    const onContinuar = vi.fn();
    render(
      <PantallaLogro
        tareaTerminada={tareaMock}
        segundosTranscurridos={300}
        siguienteTarea={siguienteMock}
        onContinuar={onContinuar}
      />
    );

    const btnContinuar = screen.getByRole('button', { name: 'Continuar' });
    fireEvent.click(btnContinuar);

    expect(onContinuar).toHaveBeenCalledOnce();

    // Avanzar el temporizador posterior al clic no debe llamar de nuevo
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onContinuar).toHaveBeenCalledOnce();
  });
});
