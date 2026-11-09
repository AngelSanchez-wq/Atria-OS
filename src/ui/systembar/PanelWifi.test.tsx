import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelWifi } from './PanelWifi';
import { REDES_SIMULADAS_DISPONIBLES } from '../../store/red';

describe('PanelWifi', () => {
  const redes = REDES_SIMULADAS_DISPONIBLES;

  it('no renderiza nada cuando abierto es false', () => {
    const { container } = render(
      <PanelWifi
        abierto={false}
        enLinea={true}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra la sección real "Tu conexión" con estado y calidad', () => {
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        calidad="Buena · aprox. 10 Mbps · 50 ms"
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );

    expect(screen.getByText('Tu conexión')).toBeInTheDocument();
    expect(screen.getByText('Conectado a internet')).toBeInTheDocument();
    expect(
      screen.getByText('Calidad: Buena · aprox. 10 Mbps · 50 ms')
    ).toBeInTheDocument();
    expect(screen.getByText('Conectado a Casa-5G')).toBeInTheDocument();
  });

  it('muestra "Sin conexión" cuando la red real está desconectada', () => {
    render(
      <PanelWifi
        abierto={true}
        enLinea={false}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );

    expect(screen.getAllByText('Sin conexión a internet')[0]).toBeInTheDocument();
  });

  it('permite alternar el interruptor de Wi-Fi', () => {
    const onAlternar = vi.fn();
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={onAlternar}
        onConectarRed={vi.fn()}
      />
    );

    const switchWifi = screen.getByRole('switch', { name: 'Activar Wi-Fi' });
    fireEvent.click(switchWifi);
    expect(onAlternar).toHaveBeenCalledWith(false);
  });

  it('muestra mensaje de desactivado cuando el interruptor está apagado', () => {
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        wifiHabilitado={false}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );

    expect(screen.getByText('El Wi-Fi está desactivado.')).toBeInTheDocument();
  });

  it('lista las redes simuladas y permite conectar a otra red', () => {
    const onConectar = vi.fn();
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={onConectar}
      />
    );

    expect(screen.getByText('Casa-5G')).toBeInTheDocument();
    expect(screen.getByText('Universidad')).toBeInTheDocument();
    expect(screen.getByText('Cafetería')).toBeInTheDocument();

    // Red conectada marcada con check
    expect(screen.getByLabelText('Conectada')).toBeInTheDocument();

    // Pulsar Universidad
    const btnUniversidad = screen.getByRole('button', { name: /Universidad/i });
    fireEvent.click(btnUniversidad);
    expect(onConectar).toHaveBeenCalledWith('universidad');
  });

  it('muestra el texto de simulación y nota informativa', () => {
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={vi.fn()}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        'Los navegadores no permiten ver las redes reales. Atria-OS es una simulación.'
      )
    ).toBeInTheDocument();
  });

  it('cierra el panel al presionar Escape', () => {
    const onCerrar = vi.fn();
    render(
      <PanelWifi
        abierto={true}
        enLinea={true}
        wifiHabilitado={true}
        redConectadaId="casa-5g"
        redes={redes}
        onCerrar={onCerrar}
        onAlternarWifi={vi.fn()}
        onConectarRed={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledOnce();
  });
});
