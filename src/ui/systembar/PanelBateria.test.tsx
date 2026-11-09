import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelBateria } from './PanelBateria';

describe('PanelBateria', () => {
  it('no renderiza nada cuando abierto es false', () => {
    const { container } = render(
      <PanelBateria
        abierto={false}
        nivel={72}
        cargando={false}
        estado="descargando"
        tiempoRestante="3 h 12 min restantes"
        esSimulada={true}
        ahorroEnergia={false}
        onCerrar={vi.fn()}
        onAlternarAhorroEnergia={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el porcentaje grande, el tiempo restante y la nota de valor de ejemplo cuando es simulada', () => {
    render(
      <PanelBateria
        abierto={true}
        nivel={72}
        cargando={false}
        estado="descargando"
        tiempoRestante="3 h 12 min restantes"
        esSimulada={true}
        ahorroEnergia={false}
        onCerrar={vi.fn()}
        onAlternarAhorroEnergia={vi.fn()}
      />
    );

    expect(screen.getByText('Batería')).toBeInTheDocument();
    expect(screen.getByText('72 %')).toBeInTheDocument();
    expect(screen.getByText('Valor de ejemplo')).toBeInTheDocument();
    expect(
      screen.getByText(/Descargando · 3 h 12 min restantes/)
    ).toBeInTheDocument();
  });

  it('usa color cálido (nunca rojo) en la barra de progreso cuando el nivel es bajo (≤ 20 %)', () => {
    render(
      <PanelBateria
        abierto={true}
        nivel={18}
        cargando={false}
        estado="bajo"
        tiempoRestante="54 min restantes"
        esSimulada={false}
        ahorroEnergia={false}
        onCerrar={vi.fn()}
        onAlternarAhorroEnergia={vi.fn()}
      />
    );

    const progressbar = screen.getByRole('progressbar', {
      name: 'Nivel de batería: 18 %',
    });
    expect(progressbar).toBeInTheDocument();

    const barraRelleno = progressbar.firstElementChild as HTMLElement;
    expect(barraRelleno.className).toContain('bg-warm');
    expect(barraRelleno.className).not.toContain('bg-red');
  });

  it('usa color acento en la barra de progreso cuando el nivel es normal (> 20 %)', () => {
    render(
      <PanelBateria
        abierto={true}
        nivel={72}
        cargando={false}
        estado="descargando"
        tiempoRestante="3 h 12 min restantes"
        esSimulada={false}
        ahorroEnergia={false}
        onCerrar={vi.fn()}
        onAlternarAhorroEnergia={vi.fn()}
      />
    );

    const progressbar = screen.getByRole('progressbar', {
      name: 'Nivel de batería: 72 %',
    });
    const barraRelleno = progressbar.firstElementChild as HTMLElement;
    expect(barraRelleno.className).toContain('bg-accent');
  });

  it('permite alternar el interruptor de Ahorro de energía', () => {
    const onAlternar = vi.fn();
    render(
      <PanelBateria
        abierto={true}
        nivel={72}
        cargando={false}
        estado="descargando"
        tiempoRestante="3 h 12 min restantes"
        esSimulada={false}
        ahorroEnergia={false}
        onCerrar={vi.fn()}
        onAlternarAhorroEnergia={onAlternar}
      />
    );

    const switchAhorro = screen.getByRole('switch', {
      name: 'Ahorro de energía',
    });
    fireEvent.click(switchAhorro);
    expect(onAlternar).toHaveBeenCalledWith(true);
  });

  it('cierra el panel al presionar Escape', () => {
    const onCerrar = vi.fn();
    render(
      <PanelBateria
        abierto={true}
        nivel={72}
        cargando={false}
        estado="descargando"
        tiempoRestante="3 h 12 min restantes"
        esSimulada={false}
        ahorroEnergia={false}
        onCerrar={onCerrar}
        onAlternarAhorroEnergia={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledOnce();
  });
});
