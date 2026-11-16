import { AppId, EstadoCicloTarea, Tarea, TareaGestionada, Usuario } from '../types';
import {
  DURACIONES_PERMITIDAS,
  ETIQUETA_POR_DEFECTO,
  LONGITUD_MAX_ETIQUETA,
  LONGITUD_MAX_TITULO,
  MAXIMO_TAREAS_PENDIENTES,
  MOTIVOS_ERROR_TAREAS,
  MotivoErrorTarea,
  VERSION_DATOS_TAREAS,
} from '../../config/tareas';

/** Datos que el usuario puede indicar al crear o editar una tarea. */
export type DatosTarea = {
  titulo: string;
  app: AppId;
  minutos: number;
  etiqueta?: string;
  importante?: boolean;
};

export type DatosTareaValidados = {
  titulo: string;
  app: AppId;
  minutos: number;
  etiqueta: string;
  importante: boolean;
};

export type ResultadoValidacionTarea =
  | { ok: true; datos: DatosTareaValidados }
  | { ok: false; motivo: MotivoErrorTarea };

export type ResultadoOperacionTarea =
  | { ok: true; tarea: TareaGestionada; tareas: TareaGestionada[] }
  | { ok: false; motivo: MotivoErrorTarea };

export type ResultadoPuedeEmpezar = { ok: true } | { ok: false; motivo: MotivoErrorTarea };

/** Contexto inyectado para mantener las funciones puras (sin Date ni azar). */
export type ContextoCreacion = { id: string; ahora: number };

/** Letras (con tildes y ñ), números, guion y guion bajo. */
const PATRON_ETIQUETA = /^[\p{L}\p{N}_-]+$/u;

/** Estados en los que una tarea está ocupando al usuario y no se puede cambiar. */
const ESTADOS_EN_USO: readonly EstadoCicloTarea[] = ['en-curso', 'pausada'];

/** Normaliza una etiqueta: minúsculas, sin espacios ni '#'. Vacía → por defecto. */
export function normalizarEtiqueta(etiqueta: string | undefined): string {
  const limpia = (etiqueta ?? '').toLowerCase().replace(/[\s#]+/g, '');
  return limpia.length === 0 ? ETIQUETA_POR_DEFECTO : limpia;
}

/**
 * Valida los datos de una tarea para el usuario indicado.
 * - Título no vacío tras recortar espacios y dentro de LONGITUD_MAX_TITULO.
 * - La app debe estar en las appsHabilitadas del usuario.
 * - La duración debe estar en DURACIONES_PERMITIDAS.
 * - La etiqueta se normaliza; solo admite letras, números, '-' y '_'.
 */
export function validarTarea(datos: DatosTarea, usuario: Usuario): ResultadoValidacionTarea {
  const titulo = (datos.titulo ?? '').trim();
  if (titulo.length === 0) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TITULO_VACIO };
  if (titulo.length > LONGITUD_MAX_TITULO) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TITULO_MUY_LARGO };
  }

  if (!usuario.limites.appsHabilitadas.includes(datos.app)) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA };
  }

  if (!(DURACIONES_PERMITIDAS as readonly number[]).includes(datos.minutos)) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.DURACION_INVALIDA };
  }

  const etiqueta = normalizarEtiqueta(datos.etiqueta);
  if (!PATRON_ETIQUETA.test(etiqueta)) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.ETIQUETA_INVALIDA };
  }
  if (etiqueta.length > LONGITUD_MAX_ETIQUETA) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.ETIQUETA_MUY_LARGA };
  }

  return {
    ok: true,
    datos: {
      titulo,
      app: datos.app,
      minutos: datos.minutos,
      etiqueta,
      importante: datos.importante ?? false,
    },
  };
}

/** Cuenta las tareas sin terminar de un usuario. */
export function contarSinTerminar(tareas: readonly TareaGestionada[], usuarioId: string): number {
  return tareas.filter((t) => t.usuarioId === usuarioId && t.estado !== 'hecha').length;
}

/** Busca la tarea y comprueba que el actor sea su dueño. */
function buscarPropia(
  actor: Usuario,
  tareas: readonly TareaGestionada[],
  tareaId: string
): { ok: true; tarea: TareaGestionada } | { ok: false; motivo: MotivoErrorTarea } {
  const tarea = tareas.find((t) => t.id === tareaId);
  if (!tarea) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TAREA_NO_EXISTE };
  if (tarea.usuarioId !== actor.id) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO };
  return { ok: true, tarea };
}

/** Crea una tarea nueva del actor, respetando MAXIMO_TAREAS_PENDIENTES. */
export function crearTarea(
  actor: Usuario,
  tareas: readonly TareaGestionada[],
  datos: DatosTarea,
  contexto: ContextoCreacion
): ResultadoOperacionTarea {
  const validacion = validarTarea(datos, actor);
  if (!validacion.ok) return validacion;

  if (contarSinTerminar(tareas, actor.id) >= MAXIMO_TAREAS_PENDIENTES) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.MAXIMO_PENDIENTES };
  }

  const tarea: TareaGestionada = {
    id: contexto.id,
    usuarioId: actor.id,
    ...validacion.datos,
    estado: 'pendiente',
    creadaEn: contexto.ahora,
  };

  return { ok: true, tarea, tareas: [...tareas, tarea] };
}

/**
 * Edita una tarea del actor. No se puede editar una tarea en curso o pausada.
 * Los cambios se combinan con los datos actuales y se validan de nuevo.
 */
export function editarTarea(
  actor: Usuario,
  tareas: readonly TareaGestionada[],
  tareaId: string,
  cambios: Partial<DatosTarea>
): ResultadoOperacionTarea {
  const busqueda = buscarPropia(actor, tareas, tareaId);
  if (!busqueda.ok) return busqueda;
  const actual = busqueda.tarea;

  if (ESTADOS_EN_USO.includes(actual.estado)) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO };
  }

  const validacion = validarTarea(
    {
      titulo: cambios.titulo ?? actual.titulo,
      app: cambios.app ?? actual.app,
      minutos: cambios.minutos ?? actual.minutos,
      etiqueta: cambios.etiqueta ?? actual.etiqueta,
      importante: cambios.importante ?? actual.importante,
    },
    actor
  );
  if (!validacion.ok) return validacion;

  const tarea: TareaGestionada = { ...actual, ...validacion.datos };
  return { ok: true, tarea, tareas: tareas.map((t) => (t.id === tareaId ? tarea : t)) };
}

/** Elimina una tarea del actor. No se puede eliminar una tarea en curso o pausada. */
export function eliminarTarea(
  actor: Usuario,
  tareas: readonly TareaGestionada[],
  tareaId: string
): ResultadoOperacionTarea {
  const busqueda = buscarPropia(actor, tareas, tareaId);
  if (!busqueda.ok) return busqueda;

  if (ESTADOS_EN_USO.includes(busqueda.tarea.estado)) {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO };
  }

  return {
    ok: true,
    tarea: busqueda.tarea,
    tareas: tareas.filter((t) => t.id !== tareaId),
  };
}

/** Marca como hecha una tarea del actor (desde cualquier estado sin terminar). */
export function marcarHecha(
  actor: Usuario,
  tareas: readonly TareaGestionada[],
  tareaId: string
): ResultadoOperacionTarea {
  const busqueda = buscarPropia(actor, tareas, tareaId);
  if (!busqueda.ok) return busqueda;

  if (busqueda.tarea.estado === 'hecha') {
    return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.TAREA_YA_HECHA };
  }

  const tarea: TareaGestionada = { ...busqueda.tarea, estado: 'hecha' };
  return { ok: true, tarea, tareas: tareas.map((t) => (t.id === tareaId ? tarea : t)) };
}

/** Cambia el estado de una tarea sin validar (uso interno del flujo del escritorio). */
export function cambiarEstadoTarea(
  tareas: readonly TareaGestionada[],
  tareaId: string,
  estado: EstadoCicloTarea
): TareaGestionada[] {
  return tareas.map((t) => (t.id === tareaId ? { ...t, estado } : t));
}

/**
 * Explica por qué una tarea no se puede sugerir ni empezar, o null si está disponible.
 * Pensado para mostrar el motivo en la Entrega 2.
 */
export function motivoNoDisponible(tarea: Tarea, usuario: Usuario): MotivoErrorTarea | null {
  if (tarea.usuarioId !== undefined && tarea.usuarioId !== usuario.id) {
    return MOTIVOS_ERROR_TAREAS.NO_ES_DUENO;
  }
  const estado = tarea.estado ?? 'pendiente';
  if (estado === 'hecha') return MOTIVOS_ERROR_TAREAS.TAREA_YA_HECHA;
  if (ESTADOS_EN_USO.includes(estado)) return MOTIVOS_ERROR_TAREAS.TAREA_EN_USO;
  if (!usuario.limites.appsHabilitadas.includes(tarea.app)) {
    return MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA;
  }
  return null;
}

/** Una tarea es sugerible si está pendiente, es del usuario y su app está habilitada. */
export function esSugerible(tarea: Tarea, usuario: Usuario): boolean {
  return motivoNoDisponible(tarea, usuario) === null;
}

/** Decide si el usuario puede empezar la tarea; el resultado explica el motivo si no. */
export function puedeEmpezarTarea(tarea: Tarea, usuario: Usuario): ResultadoPuedeEmpezar {
  const motivo = motivoNoDisponible(tarea, usuario);
  return motivo === null ? { ok: true } : { ok: false, motivo };
}

// ─── Persistencia y migración ────────────────────────────────────────────────

export type DatosTareasPersistidos = {
  version: number;
  tareasPorUsuario: Record<string, TareaGestionada[]>;
  /** Usuarios que ya recibieron las tareas semilla (nunca se vuelven a copiar). */
  inicializadas: Record<string, boolean>;
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTareaBasica(valor: unknown): valor is Tarea {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.titulo === 'string' &&
    typeof valor.app === 'string' &&
    typeof valor.minutos === 'number'
  );
}

/**
 * Completa una tarea guardada con los campos que falten.
 * Las tareas 'en-curso' o 'pausada' vuelven a 'pendiente': al cargar no hay
 * temporizador vivo que las respalde.
 */
export function normalizarTareaGuardada(tarea: Tarea, usuarioId: string): TareaGestionada {
  const estado: EstadoCicloTarea = tarea.estado === 'hecha' ? 'hecha' : 'pendiente';
  return {
    ...tarea,
    etiqueta: typeof tarea.etiqueta === 'string' ? tarea.etiqueta : '',
    usuarioId,
    importante: tarea.importante ?? false,
    estado,
    creadaEn: tarea.creadaEn ?? 0,
  };
}

/** Convierte una lista suelta (formato antiguo) en un registro por usuario. */
function agruparPorUsuario(lista: readonly unknown[]): Record<string, TareaGestionada[]> {
  const resultado: Record<string, TareaGestionada[]> = {};
  for (const item of lista) {
    // Las tareas antiguas sin dueño no se pueden asignar a nadie de forma segura
    if (!esTareaBasica(item) || typeof item.usuarioId !== 'string') continue;
    (resultado[item.usuarioId] ??= []).push(normalizarTareaGuardada(item, item.usuarioId));
  }
  return resultado;
}

/**
 * Lee los datos guardados y los lleva al formato actual.
 * Acepta: formato actual (con versión), un registro antiguo { usuarioId: Tarea[] }
 * o una lista antigua de tareas con usuarioId. Lo que no reconoce se descarta.
 * Los usuarios migrados con tareas quedan marcados como inicializados.
 */
export function migrarDatosTareas(datos: unknown): DatosTareasPersistidos {
  const vacio: DatosTareasPersistidos = {
    version: VERSION_DATOS_TAREAS,
    tareasPorUsuario: {},
    inicializadas: {},
  };

  let tareasPorUsuario: Record<string, TareaGestionada[]> = {};
  let inicializadas: Record<string, boolean> = {};

  if (Array.isArray(datos)) {
    tareasPorUsuario = agruparPorUsuario(datos);
  } else if (esObjeto(datos) && typeof datos.version === 'number') {
    const registro = esObjeto(datos.tareasPorUsuario) ? datos.tareasPorUsuario : {};
    for (const [usuarioId, lista] of Object.entries(registro)) {
      if (!Array.isArray(lista)) continue;
      tareasPorUsuario[usuarioId] = lista
        .filter(esTareaBasica)
        .map((t) => normalizarTareaGuardada(t, usuarioId));
    }
    if (esObjeto(datos.inicializadas)) {
      for (const [usuarioId, valor] of Object.entries(datos.inicializadas)) {
        if (valor === true) inicializadas[usuarioId] = true;
      }
    }
  } else if (esObjeto(datos)) {
    for (const [usuarioId, lista] of Object.entries(datos)) {
      if (!Array.isArray(lista)) continue;
      tareasPorUsuario[usuarioId] = lista
        .filter(esTareaBasica)
        .map((t) => normalizarTareaGuardada(t, usuarioId));
    }
  } else {
    return vacio;
  }

  for (const [usuarioId, lista] of Object.entries(tareasPorUsuario)) {
    if (lista.length > 0) inicializadas = { ...inicializadas, [usuarioId]: true };
  }

  return { version: VERSION_DATOS_TAREAS, tareasPorUsuario, inicializadas };
}
