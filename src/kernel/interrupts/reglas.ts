import {
  Notificacion,
  NivelUrgencia,
  DecisionEntrega,
  TipoNotificacion,
} from '../types';

/**
 * Clasifica una urgencia numérica (1 a 5) en su nivel cualitativo:
 * - 5: urgente
 * - 3 y 4: normal
 * - 1 y 2: baja
 */
export function nivelDeUrgencia(urgencia: number): NivelUrgencia {
  if (urgencia >= 5) return 'urgente';
  if (urgencia >= 3) return 'normal';
  return 'baja';
}

/**
 * Contexto del sistema al evaluar la entrega de una notificación.
 */
export type ContextoEntrega = {
  hayTareaEnCurso: boolean;
};

/**
 * Decide si una notificación debe entregarse de forma inmediata o retenerse en cola.
 *
 * REGLA DE FOCO:
 * Hoy solo la urgencia 5 interrumpe directamente al usuario, sin importar si hay tarea en curso o no.
 * El resto (urgencias 1 a 4) se retiene hasta la revisión periódica por lotes o hasta que
 * el usuario las consulte explícitamente en la app Burble, protegiendo su atención y concentración.
 */
export function decidirEntrega(
  notificacion: Pick<Notificacion, 'urgencia'>,
  contexto: ContextoEntrega
): DecisionEntrega {
  // La regla de modo foco se expresa mediante el contexto:
  // Hoy solo la urgencia 5 interrumpe directamente. Las de urgencia 1 a 4 se retienen
  // tanto con tarea en curso como sin ella, hasta la revisión periódica o consulta manual.
  if (notificacion.urgencia >= 5) {
    return 'inmediata';
  }
  if (contexto.hayTareaEnCurso) {
    return 'retener';
  }
  return 'retener';
}

/**
 * Agrupa una lista de notificaciones según su nivel de urgencia.
 */
export function agruparPorNivel(
  notificaciones: Notificacion[]
): Record<NivelUrgencia, Notificacion[]> {
  const grupos: Record<NivelUrgencia, Notificacion[]> = {
    urgente: [],
    normal: [],
    baja: [],
  };

  for (const n of notificaciones) {
    const nivel = nivelDeUrgencia(n.urgencia);
    grupos[nivel].push(n);
  }

  return grupos;
}

/**
 * Cuenta cuántas notificaciones hay de cada tipo.
 */
export function contarPorTipo(
  notificaciones: Notificacion[]
): Record<TipoNotificacion, number> {
  const conteo: Record<TipoNotificacion, number> = {
    sistema: 0,
    mensajes: 0,
    recordatorios: 0,
    alertas: 0,
  };

  for (const n of notificaciones) {
    conteo[n.tipo] = (conteo[n.tipo] || 0) + 1;
  }

  return conteo;
}

/**
 * Pasa todas las notificaciones 'retenida' a 'entregada' en lote.
 * Conserva intactas las que ya estaban 'entregada' o 'leida'.
 */
export function entregarLote(notificaciones: Notificacion[]): Notificacion[] {
  return notificaciones.map((n) =>
    n.estado === 'retenida' ? { ...n, estado: 'entregada' } : n
  );
}

/**
 * Marca notificaciones como 'leida'.
 * Si se especifica una lista de IDs, solo se marcan esas.
 * Si se omite la lista, se marcan todas las notificaciones existentes como leídas.
 */
export function marcarLeidas(
  notificaciones: Notificacion[],
  ids?: string[]
): Notificacion[] {
  if (!ids) {
    return notificaciones.map((n) => ({ ...n, estado: 'leida' }));
  }

  const idsSet = new Set(ids);
  return notificaciones.map((n) =>
    idsSet.has(n.id) ? { ...n, estado: 'leida' } : n
  );
}

/**
 * Cuenta todas las notificaciones que no han sido leídas (tanto retenidas como entregadas).
 */
export function contarSinLeer(notificaciones: Notificacion[]): number {
  return notificaciones.filter((n) => n.estado !== 'leida').length;
}

/**
 * Calcula el timestamp de la próxima revisión periódica.
 */
export function proximaRevision(ahora: number, intervalo: number): number {
  return ahora + intervalo;
}
