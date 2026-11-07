import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTema } from './tema';
import { platform } from '../platform/web';

describe('Store Tema', () => {
  beforeEach(() => {
    localStorage.clear();
    useTema.getState().setPreferencia('claro');
  });

  it('cambia el tema a oscuro y actualiza el atributo del documento', () => {
    useTema.getState().setPreferencia('oscuro');
    expect(useTema.getState().preferencia).toBe('oscuro');
    expect(useTema.getState().temaEfectivo).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('maneja el modo auto consultando el sistema', () => {
    vi.spyOn(platform, 'getSystemTheme').mockReturnValue('oscuro');
    useTema.getState().setPreferencia('auto');

    expect(useTema.getState().preferencia).toBe('auto');
    expect(useTema.getState().temaEfectivo).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
