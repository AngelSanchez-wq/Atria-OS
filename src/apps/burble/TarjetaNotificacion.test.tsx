import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TarjetaNotificacion } from './TarjetaNotificacion';
import { Notificacion } from '../../kernel/types';

describe('TarjetaNotificacion', () => {
  const notificacionNormal: Notificacion = {
    id: 'n-1',
    tipo: 'mensajes',
    urgencia: 3,
    titulo: 'Mateo te escribió',
    detalle: '¿Terminaste el borrador?',
    creadaEn: 1601462400000,
    estado: 'entregada',
  };

  const notificacionUrgente: Notificacion = {
    id: 'n-2',
    tipo: 'alertas',
    urgencia: 5,
    titulo: 'Alerta de seguridad',
    detalle: 'Actualización requerida de inmediato',
    creadaEn: 1601462400000,
    estado: 'entregada',
  };

  it('renderiza título, detalle, tipo, hora y botones', () => {
    render(
      <TarjetaNotificacion
        notificacion={notificacionNormal}
        onEntendido={vi.fn()}
        onMasTarde={vi.fn()}
        onVolver={vi.fn()}
      />
    );

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Mateo te escribió')).toBeInTheDocument();
    expect(screen.getByText('¿Terminaste el borrador?')).toBeInTheDocument();
    expect(screen.getByText('Mensajes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Más tarde' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al resumen' })).toBeInTheDocument();
    expect(screen.getByText(/Enter: Entendido · M: Más tarde/)).toBeInTheDocument();
  });

  it('aplica estilo urgente con etiqueta Urgente y borde amarillo pastel', () => {
    const { container } = render(
      <TarjetaNotificacion
        notificacion={notificacionUrgente}
        onEntendido={vi.fn()}
        onMasTarde={vi.fn()}
        onVolver={vi.fn()}
      />
    );

    expect(screen.getByText('Urgente')).toBeInTheDocument();
    const article = container.querySelector('article');
    expect(article?.className).toContain('border-l-warm-line');
  });

  it('enfoca automáticamente el botón Entendido al renderizar', () => {
    render(
      <TarjetaNotificacion
        notificacion={notificacionNormal}
        onEntendido={vi.fn()}
        onMasTarde={vi.fn()}
        onVolver={vi.fn()}
      />
    );

    const botonEntendido = screen.getByRole('button', { name: 'Entendido' });
    expect(document.activeElement).toBe(botonEntendido);
  });

  it('activa Entendido al pulsar la tecla Enter', () => {
    const onEntendido = vi.fn();
    render(
      <TarjetaNotificacion
        notificacion={notificacionNormal}
        onEntendido={onEntendido}
        onMasTarde={vi.fn()}
        onVolver={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onEntendido).toHaveBeenCalledTimes(1);
  });

  it('activa Más tarde al pulsar la tecla M', () => {
    const onMasTarde = vi.fn();
    render(
      <TarjetaNotificacion
        notificacion={notificacionNormal}
        onEntendido={vi.fn()}
        onMasTarde={onMasTarde}
        onVolver={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'm' });
    expect(onMasTarde).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'M' });
    expect(onMasTarde).toHaveBeenCalledTimes(2);
  });

  it('llama a onVolver al hacer clic en Volver al resumen', () => {
    const onVolver = vi.fn();
    render(
      <TarjetaNotificacion
        notificacion={notificacionNormal}
        onEntendido={vi.fn()}
        onMasTarde={vi.fn()}
        onVolver={onVolver}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volver al resumen' }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
