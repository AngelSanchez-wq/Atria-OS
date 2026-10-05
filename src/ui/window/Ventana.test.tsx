import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Ventana } from './Ventana';
import { DatosVentana } from '../../store/ventanas';

describe('Ventana', () => {
  const ventanaMock: DatosVentana = {
    id: 'ventana-1',
    appId: 'focuspad',
    pid: 1,
    x: 50,
    y: 60,
    ancho: 760,
    alto: 520,
    estado: 'normal',
    ordenFoco: 1,
  };

  it('renderiza con role dialog y maneja enfoque al hacer clic', () => {
    const onEnfocar = vi.fn();
    render(
      <Ventana
        ventana={ventanaMock}
        enfocada={true}
        onEnfocar={onEnfocar}
        onMinimizar={vi.fn()}
        onMaximizar={vi.fn()}
        onCerrar={vi.fn()}
        onMover={vi.fn()}
      >
        <div>Contenido de prueba</div>
      </Ventana>
    );

    const dialog = screen.getByRole('dialog', { name: 'FocusPad' });
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toContain('border-2 border-accent');

    fireEvent.pointerDown(dialog);
    expect(onEnfocar).toHaveBeenCalled();
  });

  it('se oculta con clase hidden cuando está minimizada sin desmontar el contenido', () => {
    const ventanaMinimizada: DatosVentana = {
      ...ventanaMock,
      estado: 'minimizada',
    };

    render(
      <Ventana
        ventana={ventanaMinimizada}
        enfocada={false}
        onEnfocar={vi.fn()}
        onMinimizar={vi.fn()}
        onMaximizar={vi.fn()}
        onCerrar={vi.fn()}
        onMover={vi.fn()}
      >
        <div>Contenido persistente</div>
      </Ventana>
    );

    const dialog = screen.getByRole('dialog', { name: 'FocusPad', hidden: true });
    expect(dialog.className).toContain('hidden');
    expect(screen.getByText('Contenido persistente')).toBeInTheDocument();
  });
});
