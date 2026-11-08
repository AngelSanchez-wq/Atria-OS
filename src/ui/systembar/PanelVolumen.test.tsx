import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelVolumen } from './PanelVolumen';

describe('PanelVolumen', () => {
  it('no renderiza nada cuando abierto es false', () => {
    const { container } = render(
      <PanelVolumen
        abierto={false}
        volumen={0.7}
        silenciado={false}
        onCerrar={vi.fn()}
        onCambiarVolumen={vi.fn()}
        onAlternarSilencio={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza título, botón de silencio con aria-pressed, slider accesible, porcentaje y texto', () => {
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.7}
        silenciado={false}
        onCerrar={vi.fn()}
        onCambiarVolumen={vi.fn()}
        onAlternarSilencio={vi.fn()}
      />
    );

    expect(screen.getByText('Volumen')).toBeInTheDocument();
    expect(screen.getByText('70 %')).toBeInTheDocument();
    expect(
      screen.getByText('Controla todos los sonidos del sistema.')
    ).toBeInTheDocument();

    const botonSilencio = screen.getByRole('button', { name: 'Silenciar' });
    expect(botonSilencio).toBeInTheDocument();
    expect(botonSilencio).toHaveAttribute('aria-pressed', 'false');

    const slider = screen.getByRole('slider', { name: 'Volumen del sistema' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '70');
    expect(slider).toHaveAttribute('aria-valuetext', '70 %');
  });

  it('muestra el botón de silencio activado cuando silenciado es true', () => {
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.5}
        silenciado={true}
        onCerrar={vi.fn()}
        onCambiarVolumen={vi.fn()}
        onAlternarSilencio={vi.fn()}
      />
    );

    const botonSilencio = screen.getByRole('button', { name: 'Activar sonido' });
    expect(botonSilencio).toHaveAttribute('aria-pressed', 'true');
  });

  it('llama a onAlternarSilencio al hacer clic en el botón de silencio', () => {
    const onAlternarSilencio = vi.fn();
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.7}
        silenciado={false}
        onCerrar={vi.fn()}
        onCambiarVolumen={vi.fn()}
        onAlternarSilencio={onAlternarSilencio}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Silenciar' }));
    expect(onAlternarSilencio).toHaveBeenCalledTimes(1);
  });

  it('llama a onCambiarVolumen al modificar el slider', () => {
    const onCambiarVolumen = vi.fn();
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.5}
        silenciado={false}
        onCerrar={vi.fn()}
        onCambiarVolumen={onCambiarVolumen}
        onAlternarSilencio={vi.fn()}
      />
    );

    const slider = screen.getByRole('slider', { name: 'Volumen del sistema' });
    fireEvent.change(slider, { target: { value: '80' } });

    expect(onCambiarVolumen).toHaveBeenCalledWith(0.8);
  });

  it('permite ajustar el volumen con las flechas del teclado', () => {
    const onCambiarVolumen = vi.fn();
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.5}
        silenciado={false}
        onCerrar={vi.fn()}
        onCambiarVolumen={onCambiarVolumen}
        onAlternarSilencio={vi.fn()}
      />
    );

    const slider = screen.getByRole('slider', { name: 'Volumen del sistema' });

    // Flecha derecha (+5 %) -> 55 % = 0.55
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onCambiarVolumen).toHaveBeenCalledWith(0.55);

    // Flecha izquierda (-5 %) -> 45 % = 0.45
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onCambiarVolumen).toHaveBeenCalledWith(0.45);
  });

  it('cierra el panel al presionar la tecla Escape', () => {
    const onCerrar = vi.fn();
    render(
      <PanelVolumen
        abierto={true}
        volumen={0.7}
        silenciado={false}
        onCerrar={onCerrar}
        onCambiarVolumen={vi.fn()}
        onAlternarSilencio={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('cierra el panel al hacer clic fuera de él', () => {
    const onCerrar = vi.fn();
    render(
      <div>
        <PanelVolumen
          abierto={true}
          volumen={0.7}
          silenciado={false}
          onCerrar={onCerrar}
          onCambiarVolumen={vi.fn()}
          onAlternarSilencio={vi.fn()}
        />
        <div data-testid="afuera">Afuera</div>
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId('afuera'));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
