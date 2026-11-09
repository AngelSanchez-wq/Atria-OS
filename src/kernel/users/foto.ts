/**
 * Constantes y funciones puras para la validación y recorte de fotos de perfil en Atria-OS.
 */

export const FORMATOS_FOTO_PERMITIDOS = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type FormatoFotoPermitido = (typeof FORMATOS_FOTO_PERMITIDOS)[number];

/** Tamaño máximo de archivo de entrada: 5 MB */
export const TAMANO_MAX_ENTRADA_BYTES = 5 * 1024 * 1024;

/** Dimensión fija del avatar cuadrado redimensionado: 256x256 px */
export const LADO_FOTO_PX = 256;

/** Longitud máxima de la cadena data URL base64 guardada en el usuario (150.000 caracteres) */
export const LONGITUD_MAX_FOTO = 150000;

/** Calidad de compresión para exportación en JPEG o WebP */
export const CALIDAD_COMPRESION_FOTO = 0.85;

export type MotivoValidacionFoto =
  | 'formato-no-permitido'
  | 'archivo-muy-grande';

export type ResultadoValidacionArchivo =
  | { ok: true }
  | { ok: false; motivo: MotivoValidacionFoto };

export type RecorteFoto = {
  x: number;
  y: number;
  lado: number;
};

/**
 * Valida un archivo de imagen por tipo MIME y tamaño en bytes antes de procesarlo.
 */
export function validarArchivoFoto(archivo: {
  tipo: string;
  tamano: number;
}): ResultadoValidacionArchivo {
  if (
    !FORMATOS_FOTO_PERMITIDOS.includes(archivo.tipo as FormatoFotoPermitido)
  ) {
    return { ok: false, motivo: 'formato-no-permitido' };
  }

  if (archivo.tamano > TAMANO_MAX_ENTRADA_BYTES) {
    return { ok: false, motivo: 'archivo-muy-grande' };
  }

  return { ok: true };
}

const PREFIJOS_VALIDOS = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/webp;base64,',
];

/**
 * Comprueba que la cadena sea un data URL seguro con prefijo permitido y no exceda la longitud máxima.
 * Rechaza explícitamente SVG y cualquier otro prefijo no permitido.
 */
export function fotoValida(dataUrl: unknown): boolean {
  if (typeof dataUrl !== 'string') return false;

  if (dataUrl.length === 0 || dataUrl.length > LONGITUD_MAX_FOTO) {
    return false;
  }

  const tienePrefijoValido = PREFIJOS_VALIDOS.some((prefijo) =>
    dataUrl.startsWith(prefijo)
  );

  if (!tienePrefijoValido) {
    return false;
  }

  // Verificar que contenga contenido base64 después del prefijo
  const indiceComa = dataUrl.indexOf(',');
  if (indiceComa === -1 || indiceComa === dataUrl.length - 1) {
    return false;
  }

  return true;
}

/**
 * Calcula un recorte cuadrado centrado en la imagen aplicando un factor de zoom entre 1 y 3.
 *
 * @param anchoImg Ancho natural de la imagen en píxeles.
 * @param altoImg Alto natural de la imagen en píxeles.
 * @param zoom Nivel de zoom aplicado (se acota entre 1 y 3).
 * @returns Coordenadas { x, y, lado } del recorte en coordenadas de la imagen original.
 */
export function calcularRecorte(
  anchoImg: number,
  altoImg: number,
  zoom: number
): RecorteFoto {
  const anchoValido = Math.max(1, anchoImg);
  const altoValido = Math.max(1, altoImg);

  // Asegurar zoom en el rango [1, 3]
  const zoomSeguro = Math.min(3, Math.max(1, zoom));

  const ladoBase = Math.min(anchoValido, altoValido);
  const lado = Math.max(1, Math.round(ladoBase / zoomSeguro));

  // Centrado respecto al centro de la imagen
  let x = Math.round((anchoValido - lado) / 2);
  let y = Math.round((altoValido - lado) / 2);

  // Comprobar y ajustar límites estrictos
  x = Math.max(0, Math.min(anchoValido - lado, x));
  y = Math.max(0, Math.min(altoValido - lado, y));

  return { x, y, lado };
}
