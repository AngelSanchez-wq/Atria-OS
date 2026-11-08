import { create } from 'zustand';
import {
  Notificacion,
  TipoNotificacion,
  SegmentoRevision,
  EstadoProgresoRevision,
} from '../kernel/types';
import {
  decidirEntrega,
  entregarLote,
  marcarLeidas,
  marcarLeida,
  colaDeRevision,
  siguientePendiente,
  progresoRevision,
  quedanPospuestas,
  segmentosRevision,
  contarSinLeer,
  proximaRevision as calcularProximaRevision,
} from '../kernel/interrupts/reglas';
import { INTERVALO_REVISION_MS } from '../config/notificaciones';
import { useTareas } from './tareas';

export type DatosNuevaNotificacion = {
  id?: string;
  tipo: TipoNotificacion;
  urgencia: number;
  titulo: string;
  detalle?: string;
  creadaEn?: number;
  estado?: Notificacion['estado'];
};

export type EstadoRevision =
  | 'inactiva'
  | 'en-curso'
  | 'terminada'
  | 'terminada-con-pendientes';

type NotificacionesStore = {
  notificaciones: Notificacion[];
  proximaRevision: number | null;
  avisoUrgente: Notificacion | null;

  // Estado de revisión una por una
  enRevision: boolean;
  idActualRevision: string | null;
  idsPospuestasRevision: string[];
  colaRevisionIds: string[];

  // Acciones generales
  recibir: (datos: DatosNuevaNotificacion) => Notificacion;
  entregarLote: () => void;
  marcarLeidas: (ids?: string[]) => void;
  descartarAvisoUrgente: () => void;
  establecerProximaRevision: (tiempo: number | null) => void;
  reiniciar: () => void;

  // Acciones de revisión una por una
  iniciarRevision: () => void;
  entendido: (id?: string) => void;
  masTarde: (id?: string) => void;
  seguirConPospuestas: () => void;
  cerrarRevision: () => void;

  // Selector auxiliar
  contarSinLeer: () => number;
};

// TODO: Separar notificaciones por usuario (usuarioId) cuando se requiera aislamiento multiusuario en useSesion.
export const useNotificaciones = create<NotificacionesStore>((set, get) => ({
  notificaciones: [],
  proximaRevision: null,
  avisoUrgente: null,

  enRevision: false,
  idActualRevision: null,
  idsPospuestasRevision: [],
  colaRevisionIds: [],

  recibir: (datos) => {
    // Justificación de diseño contra ciclos de dependencias:
    // Se invoca useTareas.getState() en el cuerpo de la acción en lugar de importar o enlazar estados
    // a nivel superior de módulo. Esto desacopla totalmente los stores sin crear importaciones circulares,
    // ya que useTareas no conoce useNotificaciones.
    const stTareas = useTareas.getState();
    const hayTareaEnCurso = Boolean(stTareas.tareaActiva && stTareas.estado === 'en-curso');

    const id = datos.id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const creadaEn = datos.creadaEn ?? Date.now();

    const decision = decidirEntrega({ urgencia: datos.urgencia }, { hayTareaEnCurso });
    const estado = datos.estado ?? (decision === 'inmediata' ? 'entregada' : 'retenida');

    const nuevaNotificacion: Notificacion = {
      id,
      tipo: datos.tipo,
      urgencia: datos.urgencia,
      titulo: datos.titulo,
      detalle: datos.detalle,
      creadaEn,
      estado,
    };

    set((state) => {
      let nuevaColaIds = state.colaRevisionIds;

      // Si llega una urgente durante la revisión, entra al principio de la cola sin cortar la tarjeta actual
      if (state.enRevision && decision === 'inmediata') {
        if (state.idActualRevision) {
          const idx = state.colaRevisionIds.indexOf(state.idActualRevision);
          if (idx !== -1) {
            nuevaColaIds = [
              ...state.colaRevisionIds.slice(0, idx + 1),
              id,
              ...state.colaRevisionIds.slice(idx + 1),
            ];
          } else {
            nuevaColaIds = [id, ...state.colaRevisionIds];
          }
        } else {
          nuevaColaIds = [id, ...state.colaRevisionIds];
        }
      }

      return {
        notificaciones: [...state.notificaciones, nuevaNotificacion],
        avisoUrgente: decision === 'inmediata' ? nuevaNotificacion : state.avisoUrgente,
        colaRevisionIds: nuevaColaIds,
        // Si no había tarjeta actual pero estábamos en revisión, toma la recién llegada
        idActualRevision: state.enRevision && !state.idActualRevision ? id : state.idActualRevision,
      };
    });

    return nuevaNotificacion;
  },

  entregarLote: () => {
    set((state) => ({
      notificaciones: entregarLote(state.notificaciones),
      proximaRevision: calcularProximaRevision(Date.now(), INTERVALO_REVISION_MS),
    }));
  },

  marcarLeidas: (ids) => {
    set((state) => ({
      notificaciones: marcarLeidas(state.notificaciones, ids),
    }));
  },

  descartarAvisoUrgente: () => {
    set({ avisoUrgente: null });
  },

  establecerProximaRevision: (tiempo) => {
    set({ proximaRevision: tiempo });
  },

  iniciarRevision: () => {
    const state = get();
    // La entrega del lote pasa las retenidas a entregadas antes de recorrerlas
    const notificacionesEntregadas = entregarLote(state.notificaciones);
    const cola = colaDeRevision(notificacionesEntregadas);
    const primerId = cola[0]?.id ?? null;

    set({
      notificaciones: notificacionesEntregadas,
      enRevision: true,
      idActualRevision: primerId,
      idsPospuestasRevision: [],
      colaRevisionIds: cola.map((n) => n.id),
      proximaRevision: calcularProximaRevision(Date.now(), INTERVALO_REVISION_MS),
    });
  },

  entendido: (id) => {
    const state = get();
    const idObjetivo = typeof id === 'string' ? id : state.idActualRevision;
    if (!idObjetivo) return;

    // 1. Marcar como leída de forma individual
    const actualizadas = marcarLeida(state.notificaciones, idObjetivo);

    // 2. Reconstruir la cola actual de revisión
    const colaActual = state.colaRevisionIds
      .map((colaId) => actualizadas.find((n) => n.id === colaId))
      .filter((n): n is Notificacion => n !== undefined);

    // 3. Determinar el siguiente ID pendiente (omitiendo las pospuestas para esta pasada)
    const siguienteId = siguientePendiente(
      colaActual,
      idObjetivo,
      state.idsPospuestasRevision
    );

    set({
      notificaciones: actualizadas,
      idActualRevision: siguienteId,
    });
  },

  masTarde: (id) => {
    const state = get();
    const idObjetivo = typeof id === 'string' ? id : state.idActualRevision;
    if (!idObjetivo) return;

    // 1. Registrar en lista de IDs pospuestos si aún no estaba
    const nuevasPospuestas = state.idsPospuestasRevision.includes(idObjetivo)
      ? state.idsPospuestasRevision
      : [...state.idsPospuestasRevision, idObjetivo];

    // 2. Reordenar la cola mandando la pospuesta al final
    const colaIdsReordenada = [
      ...state.colaRevisionIds.filter((cid) => cid !== idObjetivo),
      idObjetivo,
    ];

    const colaActual = colaIdsReordenada
      .map((colaId) => state.notificaciones.find((n) => n.id === colaId))
      .filter((n): n is Notificacion => n !== undefined);

    // 3. Obtener la siguiente pendiente (omitiendo las pospuestas)
    const siguienteId = siguientePendiente(
      colaActual,
      idObjetivo,
      nuevasPospuestas
    );

    set({
      idsPospuestasRevision: nuevasPospuestas,
      colaRevisionIds: colaIdsReordenada,
      idActualRevision: siguienteId,
    });
  },

  seguirConPospuestas: () => {
    const state = get();
    const colaActual = state.colaRevisionIds
      .map((colaId) => state.notificaciones.find((n) => n.id === colaId))
      .filter((n): n is Notificacion => n !== undefined);

    const primeraPospuesta = colaActual.find(
      (n) => state.idsPospuestasRevision.includes(n.id) && n.estado !== 'leida'
    );

    set({
      idActualRevision: primeraPospuesta ? primeraPospuesta.id : null,
      idsPospuestasRevision: [],
    });
  },

  cerrarRevision: () => {
    set({
      enRevision: false,
      idActualRevision: null,
      idsPospuestasRevision: [],
      colaRevisionIds: [],
    });
  },

  reiniciar: () => {
    set({
      notificaciones: [],
      proximaRevision: null,
      avisoUrgente: null,
      enRevision: false,
      idActualRevision: null,
      idsPospuestasRevision: [],
      colaRevisionIds: [],
    });
  },

  contarSinLeer: () => {
    return contarSinLeer(get().notificaciones);
  },
}));

/**
 * Selector para calcular el estado derivado de la revisión:
 * - 'inactiva': no se ha iniciado la revisión
 * - 'en-curso': hay una tarjeta activa mostrándose actualmente
 * - 'terminada': se revisaron todas y no queda ninguna pospuesta pendiente
 * - 'terminada-con-pendientes': terminó la cola inicial pero quedan notificaciones pospuestas sin leer
 */
export const seleccionarEstadoRevision = (state: NotificacionesStore): EstadoRevision => {
  if (!state.enRevision) return 'inactiva';
  if (state.idActualRevision !== null) return 'en-curso';

  const pendientes = quedanPospuestas(state.notificaciones, state.idsPospuestasRevision);
  return pendientes ? 'terminada-con-pendientes' : 'terminada';
};

/**
 * Selector de la cola ordenada de revisión.
 */
export const seleccionarColaRevision = (state: NotificacionesStore): Notificacion[] => {
  return state.colaRevisionIds
    .map((id) => state.notificaciones.find((n) => n.id === id))
    .filter((n): n is Notificacion => n !== undefined);
};

/**
 * Selector de la notificación actual en pantalla durante la revisión.
 */
export const seleccionarNotificacionActual = (
  state: NotificacionesStore
): Notificacion | null => {
  if (!state.idActualRevision) return null;
  return state.notificaciones.find((n) => n.id === state.idActualRevision) ?? null;
};

/**
 * Selector de los segmentos para la barra de progreso por tarjeta.
 */
export const seleccionarSegmentosRevision = (
  state: NotificacionesStore
): SegmentoRevision[] => {
  const cola = seleccionarColaRevision(state);
  return segmentosRevision(cola, state.idActualRevision, state.idsPospuestasRevision);
};

/**
 * Selector del progreso numérico (revisadas vs total) del lote en revisión.
 */
export const seleccionarProgresoRevision = (
  state: NotificacionesStore
): EstadoProgresoRevision => {
  const cola = seleccionarColaRevision(state);
  return progresoRevision(cola);
};

/**
 * Selector independiente para suscripciones directas al conteo de sin leer.
 */
export const seleccionarSinLeer = (state: NotificacionesStore): number => {
  return contarSinLeer(state.notificaciones);
};
