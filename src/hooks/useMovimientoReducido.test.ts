import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMovimientoReducido } from './useMovimientoReducido';
import { usePreferenciasStore } from '../store/preferencias';

describe('useMovimientoReducido', () => {
  const matchMediaOriginal = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    usePreferenciasStore.getState().reiniciar();
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
  });

  it('devuelve false cuando la preferencia es sistema y el SO no tiene prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMovimientoReducido());
    expect(result.current).toBe(false);
  });

  it('devuelve true cuando la preferencia es sistema pero el SO tiene prefers-reduced-motion activo', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMovimientoReducido());
    expect(result.current).toBe(true);
  });

  it('devuelve true cuando el usuario activa "reducir" en el store, ignorando el SO', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMovimientoReducido());
    expect(result.current).toBe(false);

    act(() => {
      usePreferenciasStore.getState().setMovimiento('reducir');
    });

    expect(result.current).toBe(true);
  });
});
