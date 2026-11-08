import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DialogoRechazoApp } from './DialogoRechazoApp';

describe('DialogoRechazoApp', () => {
  it('no renderiza nada si rechazo es null', () => {
    const { container } = render(<DialogoRechazoApp rechazo={null} onCerrar={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el mensaje correcto cuando la app está deshabilitada', () => {
    const onCerrar = vi.fn();
    render(
      <DialogoRechazoApp
        rechazo={{ idApp: 'ambient', motivo: 'app-deshabilitada' }}
        onCerrar={onCerrar}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ambient no está disponible')).toBeInTheDocument();
    expect(
      screen.getByText('El administrador la desactivó para tu perfil.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('muestra el mensaje correcto cuando es por memoria insuficiente', () => {
    const onCerrar = vi.fn();
    render(
      <DialogoRechazoApp
        rechazo={{ idApp: 'focuspad', motivo: 'memoria-insuficiente' }}
        onCerrar={onCerrar}
      />
    );

    expect(
      screen.getByText('No hay memoria disponible para tu perfil')
    ).toBeInTheDocument();
    expect(screen.getByText('Cierra una app para abrir otra.')).toBeInTheDocument();
  });

  it('cierra con tecla Escape', () => {
    const onCerrar = vi.fn();
    render(
      <DialogoRechazoApp
        rechazo={{ idApp: 'tagfs', motivo: 'app-deshabilitada' }}
        onCerrar={onCerrar}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
