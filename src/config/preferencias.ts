export type PreferenciaMovimiento = 'sistema' | 'reducir';
export type PreferenciaContraste = 'normal' | 'alto';
export type PreferenciaTamanoTexto = 'normal' | 'grande' | 'muy-grande';

export const ESCALA_TEXTO_NORMAL = '100%';
export const ESCALA_TEXTO_GRANDE = '112.5%';
export const ESCALA_TEXTO_MUY_GRANDE = '125%';

export const ESCALAS_TEXTO: Record<PreferenciaTamanoTexto, string> = {
  normal: ESCALA_TEXTO_NORMAL,
  grande: ESCALA_TEXTO_GRANDE,
  'muy-grande': ESCALA_TEXTO_MUY_GRANDE,
};

export const CLAVE_PERSISTENCIA_MOVIMIENTO = 'atria_pref_movimiento';
export const CLAVE_PERSISTENCIA_CONTRASTE = 'atria_pref_contraste';
export const CLAVE_PERSISTENCIA_TEXTO = 'atria_pref_texto';

export const MOVIMIENTO_INICIAL: PreferenciaMovimiento = 'sistema';
export const CONTRASTE_INICIAL: PreferenciaContraste = 'normal';
export const TAMANO_TEXTO_INICIAL: PreferenciaTamanoTexto = 'normal';
