import { CategoriaEvento, GravedadEvento, EventoSistema } from './types';
import { MAXIMO_EVENTOS_REGISTRO } from './constantes';

let contadorEvento = 0;

export type ParamsCrearEvento = {
  categoria: CategoriaEvento;
  gravedad: GravedadEvento;
  mensaje: string;
  usuarioId?: string;
  instante?: number;
  id?: string;
};

/**
 * Crea un objeto EventoSistema inmutable con valores por defecto para id e instante.
 */
export function crearEvento({
  categoria,
  gravedad,
  mensaje,
  usuarioId,
  instante = Date.now(),
  id,
}: ParamsCrearEvento): EventoSistema {
  contadorEvento += 1;
  const idGenerado = id ?? `evt-${instante}-${contadorEvento}`;

  return {
    id: idGenerado,
    instante,
    categoria,
    gravedad,
    mensaje,
    ...(usuarioId ? { usuarioId } : {}),
  };
}

/**
 * Agrega un nuevo evento al final de la lista.
 * Si la lista resultante excede el máximo permitido, descarta los eventos más antiguos.
 */
export function agregarEvento(
  eventos: readonly EventoSistema[],
  nuevoEvento: EventoSistema,
  maximo: number = MAXIMO_EVENTOS_REGISTRO
): EventoSistema[] {
  const listaActualizada = [...eventos, nuevoEvento];
  if (listaActualizada.length <= maximo) {
    return listaActualizada;
  }
  // Conserva los más recientes, descartando los más antiguos al inicio del arreglo
  return listaActualizada.slice(listaActualizada.length - maximo);
}

/**
 * Filtra la lista de eventos por su categoría.
 */
export function filtrarPorCategoria(
  eventos: readonly EventoSistema[],
  categoria: CategoriaEvento
): EventoSistema[] {
  return eventos.filter((e) => e.categoria === categoria);
}

/**
 * Ordena la lista de eventos por su instante temporal.
 * Por defecto ('desc') devuelve los eventos del más reciente al más antiguo.
 */
export function ordenarPorInstante(
  eventos: readonly EventoSistema[],
  direccion: 'desc' | 'asc' = 'desc'
): EventoSistema[] {
  return [...eventos].sort((a, b) => {
    if (direccion === 'desc') {
      return b.instante - a.instante;
    }
    return a.instante - b.instante;
  });
}

/**
 * Alias semántico que ordena los eventos desde el más reciente al más antiguo.
 */
export const ordenarDelMasRecienteAlMasAntiguo = (
  eventos: readonly EventoSistema[]
): EventoSistema[] => ordenarPorInstante(eventos, 'desc');

