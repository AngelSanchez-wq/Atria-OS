import {
  Notificacion,
  NivelUrgencia,
  DecisionEntrega,
  TipoNotificacion,
  SegmentoRevision,
  EstadoProgresoRevision,
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

/**
 * Marca como 'leida' una notificación individual por su id.
 */
export function marcarLeida(
  lista: Notificacion[],
  id: string
): Notificacion[] {
  return lista.map((n) => (n.id === id ? { ...n, estado: 'leida' } : n));
}

/**
 * Mueve la notificación con el ID indicado al final de la cola sin marcarla como leída.
 */
export function posponer(
  cola: Notificacion[],
  id: string
): Notificacion[] {
  const indice = cola.findIndex((n) => n.id === id);
  if (indice === -1) return cola;
  const elemento = cola[indice];
  return [...cola.slice(0, indice), ...cola.slice(indice + 1), elemento];
}

/**
 * Construye la cola de revisión: notificaciones entregadas y no leídas,
 * situando las urgentes (urgencia >= 5) primero y respetando el orden de llegada.
 */
export function colaDeRevision(lista: Notificacion[]): Notificacion[] {
  const entregadas = lista.filter((n) => n.estado === 'entregada');
  const urgentes = entregadas.filter((n) => n.urgencia >= 5);
  const resto = entregadas.filter((n) => n.urgencia < 5);
  return [...urgentes, ...resto];
}

/**
 * Determina el ID de la siguiente notificación pendiente de revisión.
 * Busca primero a partir de la posición actual hacia adelante; si no hay más,
 * busca desde el inicio (para cubrir notificaciones no leídas anteriores).
 * Permite omitir una lista opcional de IDs (por ejemplo, notificaciones pospuestas).
 */
export function siguientePendiente(
  cola: Notificacion[],
  actualId: string | null,
  idsIgnorar: string[] = []
): string | null {
  if (cola.length === 0) return null;

  const ignorarSet = new Set(idsIgnorar);

  if (actualId === null) {
    const primera = cola.find((n) => n.estado !== 'leida' && !ignorarSet.has(n.id));
    return primera ? primera.id : null;
  }

  const indiceActual = cola.findIndex((n) => n.id === actualId);
  if (indiceActual === -1) {
    const primera = cola.find((n) => n.estado !== 'leida' && !ignorarSet.has(n.id));
    return primera ? primera.id : null;
  }

  // 1. Buscar después de la actual
  for (let i = indiceActual + 1; i < cola.length; i++) {
    if (cola[i].estado !== 'leida' && !ignorarSet.has(cola[i].id)) {
      return cola[i].id;
    }
  }

  // 2. Si no hay posteriores, buscar anteriores (sin incluir las ignoradas)
  for (let i = 0; i < indiceActual; i++) {
    if (cola[i].estado !== 'leida' && !ignorarSet.has(cola[i].id)) {
      return cola[i].id;
    }
  }

  return null;
}

/**
 * Calcula el progreso de la revisión: total de notificaciones y cuántas han sido leídas.
 */
export function progresoRevision(
  lista: Notificacion[]
): EstadoProgresoRevision {
  const total = lista.length;
  const revisadas = lista.filter((n) => n.estado === 'leida').length;
  return { revisadas, total };
}

/**
 * Evalúa si quedan notificaciones pospuestas que aún no han sido marcadas como leídas.
 */
export function quedanPospuestas(
  lista: Notificacion[],
  idsPospuestas: string[] = []
): boolean {
  if (!idsPospuestas || idsPospuestas.length === 0) return false;
  const conjuntoPospuestas = new Set(idsPospuestas);
  return lista.some((n) => conjuntoPospuestas.has(n.id) && n.estado !== 'leida');
}

/**
 * Genera el arreglo de segmentos para la barra de revisión, en orden de la cola:
 * - 'revisada': ya leída
 * - 'actual': la que se está revisando en este momento
 * - 'pospuesta': no leída y postergada previamente
 * - 'pendiente-urgente': no leída con urgencia >= 5
 * - 'pendiente': no leída normal o baja
 */
export function segmentosRevision(
  lista: Notificacion[],
  idActual: string | null,
  idsPospuestas: string[] = []
): SegmentoRevision[] {
  const conjuntoPospuestas = new Set(idsPospuestas);

  return lista.map((n) => {
    if (n.estado === 'leida') {
      return { id: n.id, estado: 'revisada' };
    }
    if (n.id === idActual) {
      return { id: n.id, estado: 'actual' };
    }
    if (conjuntoPospuestas.has(n.id)) {
      return { id: n.id, estado: 'pospuesta' };
    }
    if (n.urgencia >= 5) {
      return { id: n.id, estado: 'pendiente-urgente' };
    }
    return { id: n.id, estado: 'pendiente' };
  });
}
