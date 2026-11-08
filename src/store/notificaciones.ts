import { create } from 'zustand';
import { Notificacion, TipoNotificacion } from '../kernel/types';
import {
  decidirEntrega,
  entregarLote,
  marcarLeidas,
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
  creadaEn?: number;
  estado?: Notificacion['estado'];
};

type NotificacionesStore = {
  notificaciones: Notificacion[];
  proximaRevision: number | null;
  avisoUrgente: Notificacion | null;

  // Acciones
  recibir: (datos: DatosNuevaNotificacion) => Notificacion;
  entregarLote: () => void;
  marcarLeidas: (ids?: string[]) => void;
  descartarAvisoUrgente: () => void;
  establecerProximaRevision: (tiempo: number | null) => void;
  reiniciar: () => void;

  // Selector auxiliar
  contarSinLeer: () => number;
};

// TODO: Separar notificaciones por usuario (usuarioId) cuando se requiera aislamiento multiusuario en useSesion.
export const useNotificaciones = create<NotificacionesStore>((set, get) => ({
  notificaciones: [],
  proximaRevision: null,
  avisoUrgente: null,

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
      creadaEn,
      estado,
    };

    set((state) => ({
      notificaciones: [...state.notificaciones, nuevaNotificacion],
      avisoUrgente: decision === 'inmediata' ? nuevaNotificacion : state.avisoUrgente,
    }));

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

  reiniciar: () => {
    set({
      notificaciones: [],
      proximaRevision: null,
      avisoUrgente: null,
    });
  },

  contarSinLeer: () => {
    return contarSinLeer(get().notificaciones);
  },
}));

/**
 * Selector independiente para suscripciones directas en componentes React.
 */
export const seleccionarSinLeer = (state: NotificacionesStore): number => {
  return contarSinLeer(state.notificaciones);
};
