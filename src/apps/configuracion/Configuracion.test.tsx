import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Configuracion } from './Configuracion';
import { usePreferenciasStore } from '../../store/preferencias';
import { useTema } from '../../store/tema';

describe('Configuracion', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      usePreferenciasStore.getState().reiniciar();
      useTema.getState().setPreferencia('claro');
    });
  });

  it('muestra la sección Apariencia por defecto con el selector de tema y pie', () => {
    render(<Configuracion />);

    expect(screen.getByRole('tab', { name: 'Apariencia' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Tema' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Seleccionar tema' })).toBeInTheDocument();
    expect(screen.getByText('El tema se guarda en este equipo.')).toBeInTheDocument();
    expect(screen.getByText(/muestra del entorno/i)).toBeInTheDocument();
    expect(screen.getByText('Atria-OS v2.4 Estable')).toBeInTheDocument();
    expect(screen.getByText('Sincronizado localmente')).toBeInTheDocument();
  });

  it('cambia a la sección Texto y permite modificar la escala tipográfica', () => {
    render(<Configuracion />);

    const tabTexto = screen.getByRole('tab', { name: 'Texto' });
    fireEvent.click(tabTexto);

    expect(tabTexto).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Tamaño del texto' })).toBeInTheDocument();
    expect(
      screen.getByText('Así se verá el texto del sistema.')
    ).toBeInTheDocument();

    const radioGrande = screen.getByRole('radio', { name: 'Grande' });
    fireEvent.click(radioGrande);

    expect(usePreferenciasStore.getState().tamanoTexto).toBe('grande');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('grande');
  });

  it('cambia a la sección Accesibilidad y permite alternar los interruptores', () => {
    render(<Configuracion />);

    const tabAccesibilidad = screen.getByRole('tab', { name: 'Accesibilidad' });
    fireEvent.click(tabAccesibilidad);

    expect(tabAccesibilidad).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Accesibilidad' })).toBeInTheDocument();

    const switchMovimiento = screen.getByRole('switch', {
      name: 'Reducir el movimiento',
    });
    const switchContraste = screen.getByRole('switch', {
      name: 'Contraste alto',
    });

    expect(switchMovimiento).toHaveAttribute('aria-checked', 'false');
    expect(switchContraste).toHaveAttribute('aria-checked', 'false');

    // Activar Reducir el movimiento
    fireEvent.click(switchMovimiento);
    expect(usePreferenciasStore.getState().movimiento).toBe('reducir');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
    expect(switchMovimiento).toHaveAttribute('aria-checked', 'true');

    // Activar Contraste alto
    fireEvent.click(switchContraste);
    expect(usePreferenciasStore.getState().contraste).toBe('alto');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
    expect(switchContraste).toHaveAttribute('aria-checked', 'true');
  });
});
