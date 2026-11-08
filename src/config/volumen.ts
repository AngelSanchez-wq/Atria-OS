/**
 * Constantes de configuración y claves de persistencia para el volumen maestro del sistema.
 */

/**
 * Nivel de volumen maestro inicial del sistema (de 0 a 1).
 * Corresponde al 70 % (0.7).
 */
export const VOLUMEN_MAESTRO_INICIAL = 0.7;

/**
 * Estado inicial de silencio del sistema.
 */
export const SILENCIADO_INICIAL = false;

/**
 * Clave de persistencia para el nivel de volumen en la plataforma.
 */
export const CLAVE_PERSISTENCIA_VOLUMEN = 'atria_volumen_maestro';

/**
 * Clave de persistencia para el estado de silencio en la plataforma.
 */
export const CLAVE_PERSISTENCIA_SILENCIO = 'atria_volumen_silenciado';
