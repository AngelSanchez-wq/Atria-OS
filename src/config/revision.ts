/**
 * Constantes y reglas responsivas para la revisión de notificaciones en Burble.
 */

// Dimensiones del anillo de progreso
export const ANILLO_MIN_PX = 140;
export const ANILLO_CQMIN = 40;
export const ANILLO_MAX_PX = 320;
export const ANILLO_GROSOR_RATIO = 0.08; // aprox. 8 % del diámetro

// Texto dentro del anillo
export const ANILLO_TEXTO_CENTRAL_MIN_PX = 24;
export const ANILLO_TEXTO_CENTRAL_MAX_PX = 48;
export const ANILLO_TEXTO_SECUNDARIO_MIN_PX = 14;
export const ANILLO_TEXTO_SECUNDARIO_MAX_PX = 18;

// Factores para la vista de logro
export const RATIO_ANILLO_LOGRO = 1.2; // Anillo completo 20 % mayor
export const RATIO_BUHO_LOGRO = 0.55; // Búho ocupa el 55 % del diámetro interior

// Dimensiones de la tarjeta individual
export const TARJETA_MIN_ANCHO_PX = 420;
export const TARJETA_CQW = 60;
export const TARJETA_MAX_ANCHO_PX = 640;
export const TARJETA_TITULO_MIN_PX = 20;
export const TARJETA_TITULO_MAX_PX = 32;
export const TARJETA_DETALLE_MIN_PX = 15;
export const TARJETA_DETALLE_MAX_PX = 20;

// Botones de acción
export const BOTON_MIN_ALTO_PX = 44;
export const BOTON_MAX_ALTO_PX = 52;

// Umbrales de visualización y animación
export const LIMITE_SEGMENTOS_CONTINUO = 12;
export const TRANSICION_SEGMENTO_MS = 250;

/**
 * Clases de utilidad Tailwind con unidades de contenedor (cqmin, cqw)
 * y funciones clamp() para garantizar escalado fluido al maximizar la ventana.
 */
export const CLASE_CONTENEDOR_BURBLE = '[container-type:size]';
export const CLASE_ANILLO_RESPONSIVO = 'w-[clamp(140px,40cqmin,320px)] h-[clamp(140px,40cqmin,320px)]';
export const CLASE_ANILLO_LOGRO_RESPONSIVO = 'w-[clamp(168px,48cqmin,384px)] h-[clamp(168px,48cqmin,384px)]';
export const CLASE_TARJETA_RESPONSIVA = 'w-full max-w-[clamp(420px,60cqw,640px)]';
