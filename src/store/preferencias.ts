import { create } from 'zustand';
import {
  PreferenciaMovimiento,
  PreferenciaContraste,
  PreferenciaTamanoTexto,
  CLAVE_PERSISTENCIA_MOVIMIENTO,
  CLAVE_PERSISTENCIA_CONTRASTE,
  CLAVE_PERSISTENCIA_TEXTO,
  MOVIMIENTO_INICIAL,
  CONTRASTE_INICIAL,
  TAMANO_TEXTO_INICIAL,
} from '../config/preferencias';
import { platform } from '../platform/web';

export type PreferenciasStore = {
  movimiento: PreferenciaMovimiento;
  contraste: PreferenciaContraste;
  tamanoTexto: PreferenciaTamanoTexto;
  setMovimiento: (movimiento: PreferenciaMovimiento) => void;
  setContraste: (contraste: PreferenciaContraste) => void;
  alternarContraste: () => void;
  setTamanoTexto: (tamano: PreferenciaTamanoTexto) => void;
  reiniciar: () => void;
};

export function aplicarAtributosDOM(
  movimiento: PreferenciaMovimiento,
  contraste: PreferenciaContraste,
  tamanoTexto: PreferenciaTamanoTexto
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-reduced-motion', movimiento === 'reducir' ? 'true' : 'false');
  root.setAttribute('data-contrast', contraste === 'alto' ? 'high' : 'normal');
  root.setAttribute('data-text-size', tamanoTexto);
}

// Carga inicial persistida
const movimientoInicial = platform.loadState<PreferenciaMovimiento>(
  CLAVE_PERSISTENCIA_MOVIMIENTO,
  MOVIMIENTO_INICIAL
);

const contrasteInicial = platform.loadState<PreferenciaContraste>(
  CLAVE_PERSISTENCIA_CONTRASTE,
  CONTRASTE_INICIAL
);

const tamanoTextoInicial = platform.loadState<PreferenciaTamanoTexto>(
  CLAVE_PERSISTENCIA_TEXTO,
  TAMANO_TEXTO_INICIAL
);

// Aplicar inmediatamente en <html> para evitar parpadeos
aplicarAtributosDOM(movimientoInicial, contrasteInicial, tamanoTextoInicial);

// TODO: Guardar preferencias por usuario cuando exista multiusuario con persistencia individual
export const usePreferenciasStore = create<PreferenciasStore>((set, get) => ({
  movimiento: movimientoInicial,
  contraste: contrasteInicial,
  tamanoTexto: tamanoTextoInicial,

  setMovimiento: (movimiento) => {
    platform.saveState(CLAVE_PERSISTENCIA_MOVIMIENTO, movimiento);
    const { contraste, tamanoTexto } = get();
    aplicarAtributosDOM(movimiento, contraste, tamanoTexto);
    set({ movimiento });
  },

  setContraste: (contraste) => {
    platform.saveState(CLAVE_PERSISTENCIA_CONTRASTE, contraste);
    const { movimiento, tamanoTexto } = get();
    aplicarAtributosDOM(movimiento, contraste, tamanoTexto);
    set({ contraste });
  },

  alternarContraste: () => {
    const siguiente = get().contraste === 'alto' ? 'normal' : 'alto';
    get().setContraste(siguiente);
  },

  setTamanoTexto: (tamanoTexto) => {
    platform.saveState(CLAVE_PERSISTENCIA_TEXTO, tamanoTexto);
    const { movimiento, contraste } = get();
    aplicarAtributosDOM(movimiento, contraste, tamanoTexto);
    set({ tamanoTexto });
  },

  reiniciar: () => {
    platform.saveState(CLAVE_PERSISTENCIA_MOVIMIENTO, MOVIMIENTO_INICIAL);
    platform.saveState(CLAVE_PERSISTENCIA_CONTRASTE, CONTRASTE_INICIAL);
    platform.saveState(CLAVE_PERSISTENCIA_TEXTO, TAMANO_TEXTO_INICIAL);
    aplicarAtributosDOM(MOVIMIENTO_INICIAL, CONTRASTE_INICIAL, TAMANO_TEXTO_INICIAL);
    set({
      movimiento: MOVIMIENTO_INICIAL,
      contraste: CONTRASTE_INICIAL,
      tamanoTexto: TAMANO_TEXTO_INICIAL,
    });
  },
}));
