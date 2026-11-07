import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PantallaApagando } from './PantallaApagando';

describe('PantallaApagando', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra "Guardando y apagando" y llama a onTerminar al completar', async () => {
    const onTerminar = vi.fn();
    render(<PantallaApagando modo="apagando" onTerminar={onTerminar} />);

    expect(screen.getByText('Guardando y apagando')).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onTerminar).toHaveBeenCalled();
  });

  it('muestra "Reiniciando" en modo reiniciando', () => {
    render(<PantallaApagando modo="reiniciando" onTerminar={vi.fn()} />);
    expect(screen.getByText('Reiniciando')).toBeInTheDocument();
  });
});
