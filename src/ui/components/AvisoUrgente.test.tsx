import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AvisoUrgente } from './AvisoUrgente';
import { Notificacion } from '../../kernel/types';
import { DURACION_AVISO_URGENTE_MS } from '../../config/notificaciones';

describe('AvisoUrgente', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const avisoMock: Notificacion = {
    id: 'aviso-1',
    tipo: 'alertas',
    urgencia: 5,
    titulo: 'Alerta de batería crítica',
    creadaEn: 100000,
    estado: 'entregada',
  };

  it('no renderiza nada cuando aviso es null', () => {
    const { container } = render(
      <AvisoUrgente aviso={null} onDescartar={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza la alerta con role status y su título cuando hay un aviso', () => {
    render(<AvisoUrgente aviso={avisoMock} onDescartar={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Alerta de batería crítica')).toBeInTheDocument();
    expect(screen.getByText('· Ahora')).toBeInTheDocument();
  });

  it('se cierra automáticamente tras DURACION_AVISO_URGENTE_MS', () => {
    const onDescartar = vi.fn();
    render(<AvisoUrgente aviso={avisoMock} onDescartar={onDescartar} />);

    expect(onDescartar).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DURACION_AVISO_URGENTE_MS);
    });

    expect(onDescartar).toHaveBeenCalledTimes(1);
  });

  it('se cierra inmediatamente al hacer clic en el botón de cerrar', () => {
    const onDescartar = vi.fn();
    render(<AvisoUrgente aviso={avisoMock} onDescartar={onDescartar} />);

    const botonCerrar = screen.getByRole('button', { name: 'Cerrar aviso urgente' });
    fireEvent.click(botonCerrar);

    expect(onDescartar).toHaveBeenCalledTimes(1);
  });
});
