import { useState, useEffect } from 'react';
import { usePreferenciasStore } from '../store/preferencias';

/**
 * Hook compartido que combina la preferencia del sistema operativo (prefers-reduced-motion)
 * con el interruptor de preferencia del usuario en Atria-OS.
 *
 * @returns boolean `true` si el movimiento debe reducirse, `false` en caso contrario.
 */
export function useMovimientoReducido(): boolean {
  const preferenciaUsuario = usePreferenciasStore((s) => s.movimiento);
  const [preferenciaSistema, setPreferenciaSistema] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const actualizar = (e: MediaQueryListEvent) => {
        setPreferenciaSistema(e.matches);
      };

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', actualizar);
        return () => mediaQuery.removeEventListener('change', actualizar);
      } else if (typeof mediaQuery.addListener === 'function') {
        // Compatibilidad con navegadores antiguos / entornos de prueba
        mediaQuery.addListener(actualizar);
        return () => mediaQuery.removeListener(actualizar);
      }
    } catch {
      // Ignorar fallos en entornos sin soporte completo de matchMedia
    }
  }, []);

  if (preferenciaUsuario === 'reducir') {
    return true;
  }

  return preferenciaSistema;
}
