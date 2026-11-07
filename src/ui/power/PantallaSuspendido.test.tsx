import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PantallaSuspendido } from './PantallaSuspendido';

describe('PantallaSuspendido', () => {
  it('se reanuda al hacer clic o al presionar cualquier tecla', () => {
    const onReanudar = vi.fn();
    render(<PantallaSuspendido onReanudar={onReanudar} />);

    expect(screen.getByText('Sistema suspendido')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('region', { name: 'Sistema suspendido' }));
    expect(onReanudar).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'a' });
    expect(onReanudar).toHaveBeenCalledTimes(2);
  });
});
