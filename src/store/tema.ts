import { create } from 'zustand';
import { PreferenciaTema, TemaEfectivo } from '../platform/types';
import { platform } from '../platform/web';

const CLAVE_PERSISTENCIA_TEMA = 'atria_tema_preferencia';

type TemaStore = {
  preferencia: PreferenciaTema;
  temaEfectivo: TemaEfectivo;
  setPreferencia: (preferencia: PreferenciaTema) => void;
  actualizarTemaSistema: () => void;
};

function calcularTemaEfectivo(preferencia: PreferenciaTema): TemaEfectivo {
  if (preferencia === 'auto') {
    return platform.getSystemTheme();
  }
  return preferencia;
}

// Carga inicial y aplicación inmediata para evitar parpadeos
const preferenciaInicial = platform.loadState<PreferenciaTema>(
  CLAVE_PERSISTENCIA_TEMA,
  'claro'
);
const temaEfectivoInicial = calcularTemaEfectivo(preferenciaInicial);
platform.applyTheme(temaEfectivoInicial);

export const useTema = create<TemaStore>((set, get) => ({
  preferencia: preferenciaInicial,
  temaEfectivo: temaEfectivoInicial,

  setPreferencia: (preferencia) => {
    const temaEfectivo = calcularTemaEfectivo(preferencia);
    platform.saveState(CLAVE_PERSISTENCIA_TEMA, preferencia);
    platform.applyTheme(temaEfectivo);
    set({ preferencia, temaEfectivo });
  },

  actualizarTemaSistema: () => {
    const { preferencia } = get();
    if (preferencia === 'auto') {
      const temaEfectivo = platform.getSystemTheme();
      platform.applyTheme(temaEfectivo);
      set({ temaEfectivo });
    }
  },
}));
