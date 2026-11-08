import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferenciasStore } from './preferencias';
import {
  CLAVE_PERSISTENCIA_MOVIMIENTO,
  CLAVE_PERSISTENCIA_CONTRASTE,
  CLAVE_PERSISTENCIA_TEXTO,
} from '../config/preferencias';

describe('usePreferenciasStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferenciasStore.getState().reiniciar();
  });

  it('tiene los valores iniciales por defecto y los aplica al elemento html', () => {
    const estado = usePreferenciasStore.getState();
    expect(estado.movimiento).toBe('sistema');
    expect(estado.contraste).toBe('normal');
    expect(estado.tamanoTexto).toBe('normal');

    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('false');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('normal');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('normal');
  });

  it('modifica y persiste la preferencia de movimiento, actualizando data-reduced-motion', () => {
    usePreferenciasStore.getState().setMovimiento('reducir');

    expect(usePreferenciasStore.getState().movimiento).toBe('reducir');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
    expect(JSON.parse(localStorage.getItem(CLAVE_PERSISTENCIA_MOVIMIENTO)!)).toBe('reducir');

    usePreferenciasStore.getState().setMovimiento('sistema');
    expect(usePreferenciasStore.getState().movimiento).toBe('sistema');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('false');
    expect(JSON.parse(localStorage.getItem(CLAVE_PERSISTENCIA_MOVIMIENTO)!)).toBe('sistema');
  });

  it('modifica y persiste la preferencia de contraste, actualizando data-contrast', () => {
    usePreferenciasStore.getState().setContraste('alto');

    expect(usePreferenciasStore.getState().contraste).toBe('alto');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
    expect(JSON.parse(localStorage.getItem(CLAVE_PERSISTENCIA_CONTRASTE)!)).toBe('alto');

    usePreferenciasStore.getState().alternarContraste();
    expect(usePreferenciasStore.getState().contraste).toBe('normal');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('normal');
  });

  it('modifica y persiste la preferencia de tamaño de texto, actualizando data-text-size', () => {
    usePreferenciasStore.getState().setTamanoTexto('grande');

    expect(usePreferenciasStore.getState().tamanoTexto).toBe('grande');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('grande');
    expect(JSON.parse(localStorage.getItem(CLAVE_PERSISTENCIA_TEXTO)!)).toBe('grande');

    usePreferenciasStore.getState().setTamanoTexto('muy-grande');
    expect(usePreferenciasStore.getState().tamanoTexto).toBe('muy-grande');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('muy-grande');
  });

  it('reinicia todas las preferencias a sus valores originales', () => {
    usePreferenciasStore.getState().setMovimiento('reducir');
    usePreferenciasStore.getState().setContraste('alto');
    usePreferenciasStore.getState().setTamanoTexto('muy-grande');

    usePreferenciasStore.getState().reiniciar();

    const estado = usePreferenciasStore.getState();
    expect(estado.movimiento).toBe('sistema');
    expect(estado.contraste).toBe('normal');
    expect(estado.tamanoTexto).toBe('normal');

    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('false');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('normal');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('normal');
  });
});
