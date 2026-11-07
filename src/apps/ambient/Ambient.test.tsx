import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Ambient } from './Ambient';
import { useAudioStore } from '../../store/audio';
import { servicioAudio } from '../../system/audio/servicio';

describe('Ambient', () => {
  beforeEach(() => {
    useAudioStore.setState({
      sonidoActivo: null,
      volumen: 0.5,
      silenciado: false,
      aviso: null,
    });
    vi.restoreAllMocks();
  });

  it('muestra los cuatro botones con aria-pressed false y texto En silencio inicialmente', () => {
    render(<Ambient />);

    expect(screen.getByText('Sonido de fondo')).toBeInTheDocument();
    expect(screen.getByText('Elige uno. Sigue sonando mientras trabajas.')).toBeInTheDocument();

    const btnLluvia = screen.getByRole('button', { name: 'Lluvia' });
    const btnBosque = screen.getByRole('button', { name: 'Bosque' });
    const btnNoche = screen.getByRole('button', { name: 'Noche' });
    const btnArroyo = screen.getByRole('button', { name: 'Arroyo' });

    expect(btnLluvia).toHaveAttribute('aria-pressed', 'false');
    expect(btnBosque).toHaveAttribute('aria-pressed', 'false');
    expect(btnNoche).toHaveAttribute('aria-pressed', 'false');
    expect(btnArroyo).toHaveAttribute('aria-pressed', 'false');

    expect(screen.getByText('En silencio')).toBeInTheDocument();
  });

  it('al pulsar un sonido llama a reproducir y actualiza el estado a Sonando y aria-pressed', async () => {
    const spyReproducir = vi.spyOn(servicioAudio, 'reproducir').mockImplementation(async (id) => {
      useAudioStore.setState({ sonidoActivo: id });
    });

    render(<Ambient />);

    const btnLluvia = screen.getByRole('button', { name: 'Lluvia' });

    await act(async () => {
      fireEvent.click(btnLluvia);
    });

    expect(spyReproducir).toHaveBeenCalledWith('lluvia');
    expect(screen.getByRole('button', { name: /Lluvia, activo/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Sonando: Lluvia')).toBeInTheDocument();
  });

  it('al pulsar el sonido activo llama a detener y vuelve a En silencio', async () => {
    useAudioStore.setState({ sonidoActivo: 'bosque' });
    const spyDetener = vi.spyOn(servicioAudio, 'detener').mockImplementation(() => {
      useAudioStore.setState({ sonidoActivo: null });
    });

    render(<Ambient />);

    const btnBosque = screen.getByRole('button', { name: /Bosque, activo/i });

    await act(async () => {
      fireEvent.click(btnBosque);
    });

    expect(spyDetener).toHaveBeenCalled();
    expect(screen.getByText('En silencio')).toBeInTheDocument();
  });

  it('permite cambiar el volumen', () => {
    const spyVolumen = vi.spyOn(servicioAudio, 'establecerVolumen');
    render(<Ambient />);

    const slider = screen.getByRole('slider', { name: 'Volumen' });
    fireEvent.change(slider, { target: { value: '0.85' } });

    expect(spyVolumen).toHaveBeenCalledWith(0.85);
  });

  it('muestra el aviso tranquilo si el navegador bloquea la reproducción', () => {
    useAudioStore.setState({ aviso: 'Pulsa un sonido para empezar' });
    render(<Ambient />);

    expect(screen.getByText('Pulsa un sonido para empezar')).toBeInTheDocument();
  });
});
