import { create } from 'zustand';
import { Tarea, TareaGestionada, Usuario } from '../kernel/types';
import {
  iniciarLogro,
  continuarLogro,
  type InfoTareaTerminada,
} from '../kernel/tasks/transiciones';
import { instanciarSemillas } from '../kernel/tasks/tareas-semilla';
import {
  ordenarSugerencias,
  siguienteSugerencia,
  type ResultadoSugerencia,
} from '../kernel/tasks/sugerencias';
import {
  crearTarea as opCrearTarea,
  editarTarea as opEditarTarea,
  eliminarTarea as opEliminarTarea,
  marcarHecha as opMarcarHecha,
  cambiarEstadoTarea,
  esSugerible,
  migrarDatosTareas,
  puedeEmpezarTarea,
  type DatosTarea,
  type DatosTareasPersistidos,
  type ResultadoOperacionTarea,
  type ResultadoPuedeEmpezar,
} from '../kernel/tasks/operaciones';
import {
  CLAVE_PERSISTENCIA_TAREAS,
  MOTIVOS_ERROR_TAREAS,
  VERSION_DATOS_TAREAS,
} from '../config/tareas';
import { platform } from '../platform/web';
import { registrar } from '../system/logging/servicio';
import { useSesion } from './sesion';
import { useUsuariosStore } from './usuarios';

/** Estado del temporizador de la tarea activa en el escritorio. */
export type EstadoTarea = 'en-curso' | 'pausada';

type RegistroTareas = Record<string, TareaGestionada[]>;

type TareasStore = {
  // ─── Tarea activa en el escritorio (estado de la sesión) ───
  tareaActiva: Tarea | null;
  estado: EstadoTarea;
  segundosTranscurridos: number;
  pendientes: Tarea[];
  ultimaTerminada: InfoTareaTerminada | null;
  enLogro: boolean;
  iniciada: boolean;

  // ─── Tareas guardadas por usuario (persistidas) ───
  // TODO: cuando existan más datos por usuario (notas, preferencias, etc.),
  // mover este registro a un almacén común de datos por usuario.
  tareasPorUsuario: RegistroTareas;
  /** Usuarios que ya recibieron las semillas; nunca se vuelven a copiar. */
  inicializadas: Record<string, boolean>;
  /** Id de la sugerencia mostrada en la Bienvenida (no se persiste). */
  sugerenciaActualId: string | null;

  empezar: (tarea: Tarea, restoPendientes?: Tarea[]) => void;
  pausar: () => void;
  reanudar: () => void;
  terminar: () => void;
  continuarTrasLogro: () => void;
  avanzar: (segundos: number) => void;

  inicializarUsuario: (usuarioId?: string) => void;
  crear: (datos: DatosTarea) => ResultadoOperacionTarea;
  editar: (tareaId: string, cambios: Partial<DatosTarea>) => ResultadoOperacionTarea;
  eliminar: (tareaId: string) => ResultadoOperacionTarea;
  marcarHecha: (tareaId: string) => ResultadoOperacionTarea;
  empezarTarea: (tareaId: string) => ResultadoPuedeEmpezar;
  otraSugerencia: () => void;
  liberarTareasEnCurso: (usuarioId?: string) => void;
};

type EstadoSugerencias = Pick<TareasStore, 'tareasPorUsuario' | 'sugerenciaActualId'>;

const LISTA_VACIA: TareaGestionada[] = [];

// ─── Persistencia ────────────────────────────────────────────────────────────

// Carga inicial: migra formatos antiguos y devuelve a 'pendiente' lo que quedó en curso
const datosIniciales = migrarDatosTareas(
  platform.loadState<unknown>(CLAVE_PERSISTENCIA_TAREAS, null)
);

function persistir(tareasPorUsuario: RegistroTareas, inicializadas: Record<string, boolean>) {
  const datos: DatosTareasPersistidos = {
    version: VERSION_DATOS_TAREAS,
    tareasPorUsuario,
    inicializadas,
  };
  platform.saveState(CLAVE_PERSISTENCIA_TAREAS, datos);
}

function crearIdTarea(indice = 0): string {
  return `tarea-${Date.now()}-${indice}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Usuario de la sesión con sus datos más recientes (por ejemplo, si el
 * administrador cambió sus apps habilitadas después de que ingresara).
 */
function usuarioEnSesion(): Usuario | null {
  const enSesion = useSesion.getState().usuario;
  if (!enSesion) return null;
  return useUsuariosStore.getState().usuarios.find((u) => u.id === enSesion.id) ?? enSesion;
}

/** Indica si el id pertenece a la tarea de otro usuario (para explicar el rechazo). */
function esTareaAjena(registro: RegistroTareas, usuarioId: string, tareaId: string): boolean {
  return Object.entries(registro).some(
    ([id, lista]) => id !== usuarioId && lista.some((t) => t.id === tareaId)
  );
}

// ─── Selectores (puros, sobre el estado y el usuario) ────────────────────────

export function seleccionarTareasDeUsuario(
  state: Pick<TareasStore, 'tareasPorUsuario'>,
  usuarioId: string
): TareaGestionada[] {
  return state.tareasPorUsuario[usuarioId] ?? LISTA_VACIA;
}

/** Tareas pendientes del usuario, ordenadas (incluye las de apps deshabilitadas). */
export function seleccionarPendientes(
  state: Pick<TareasStore, 'tareasPorUsuario'>,
  usuario: Usuario
): TareaGestionada[] {
  return ordenarSugerencias(
    seleccionarTareasDeUsuario(state, usuario.id).filter((t) => t.estado === 'pendiente')
  );
}

/** Tareas que se pueden sugerir y empezar (pendientes y con app habilitada), ordenadas. */
export function seleccionarSugeribles(
  state: Pick<TareasStore, 'tareasPorUsuario'>,
  usuario: Usuario
): TareaGestionada[] {
  return ordenarSugerencias(
    seleccionarTareasDeUsuario(state, usuario.id).filter((t) => esSugerible(t, usuario))
  );
}

/**
 * Sugerencia que se muestra ahora. Si hay importantes, siempre es una de ellas.
 * Si la sugerencia guardada ya no es válida, se usa la primera del grupo.
 */
export function seleccionarSugerenciaActual(
  state: EstadoSugerencias,
  usuario: Usuario
): ResultadoSugerencia<TareaGestionada> {
  const sugeribles = seleccionarSugeribles(state, usuario);
  if (sugeribles.length === 0) return { tarea: null, esImportante: false };

  const importantes = sugeribles.filter((t) => t.importante);
  const grupo = importantes.length > 0 ? importantes : sugeribles;
  const tarea = grupo.find((t) => t.id === state.sugerenciaActualId) ?? grupo[0];
  return { tarea, esImportante: importantes.length > 0 };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTareas = create<TareasStore>((set, get) => {
  /** Guarda la lista de un usuario y la persiste. */
  const guardarListaDe = (usuarioId: string, lista: TareaGestionada[]) => {
    const tareasPorUsuario = { ...get().tareasPorUsuario, [usuarioId]: lista };
    set({ tareasPorUsuario });
    persistir(tareasPorUsuario, get().inicializadas);
  };

  /** Refleja en la tarea guardada el estado del escritorio (si es una tarea gestionada). */
  const sincronizarEstado = (tarea: Tarea | null, estado: TareaGestionada['estado']) => {
    if (!tarea?.usuarioId) return;
    const lista = get().tareasPorUsuario[tarea.usuarioId];
    if (!lista?.some((t) => t.id === tarea.id)) return;
    guardarListaDe(tarea.usuarioId, cambiarEstadoTarea(lista, tarea.id, estado));
  };

  /** Ejecuta una operación del kernel sobre las tareas del usuario en sesión. */
  const operar = (
    tareaId: string | null,
    operacion: (actor: Usuario, tareas: TareaGestionada[]) => ResultadoOperacionTarea,
    mensajeRegistro: (titulo: string) => string
  ): ResultadoOperacionTarea => {
    const actor = usuarioEnSesion();
    if (!actor) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.SIN_SESION };

    const registro = get().tareasPorUsuario;
    if (tareaId && esTareaAjena(registro, actor.id, tareaId)) {
      return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO };
    }

    const resultado = operacion(actor, registro[actor.id] ?? []);
    if (resultado.ok) {
      guardarListaDe(actor.id, resultado.tareas);
      // Si hay una sesión de escritorio en marcha, refresca al instante las pendientes visibles
      if (get().iniciada) {
        const activaId = get().tareaActiva?.id;
        const nuevasPendientes = ordenarSugerencias(
          resultado.tareas.filter((t) => t.id !== activaId && esSugerible(t, actor))
        );
        set({ pendientes: nuevasPendientes });
      }
      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: mensajeRegistro(resultado.tarea.titulo),
        usuarioId: actor.id,
      });
    }
    return resultado;
  };

  return {
    tareaActiva: null,
    estado: 'en-curso',
    segundosTranscurridos: 0,
    pendientes: [],
    ultimaTerminada: null,
    enLogro: false,
    iniciada: false,

    tareasPorUsuario: datosIniciales.tareasPorUsuario,
    inicializadas: datosIniciales.inicializadas,
    sugerenciaActualId: null,

    empezar: (tarea, restoPendientes = []) => {
      set({
        tareaActiva: tarea,
        estado: 'en-curso',
        segundosTranscurridos: 0,
        pendientes: restoPendientes,
        enLogro: false,
        ultimaTerminada: null,
        iniciada: true,
      });
      sincronizarEstado(tarea, 'en-curso');
    },

    pausar: () => {
      const { tareaActiva } = get();
      if (!tareaActiva) return;
      set({ estado: 'pausada' });
      sincronizarEstado(tareaActiva, 'pausada');
    },

    reanudar: () => {
      const { tareaActiva } = get();
      if (!tareaActiva) return;
      set({ estado: 'en-curso' });
      sincronizarEstado(tareaActiva, 'en-curso');
    },

    terminar: () => {
      const { tareaActiva, segundosTranscurridos } = get();
      if (!tareaActiva) return;
      set(iniciarLogro(tareaActiva, segundosTranscurridos));
      // La tarea terminada pasa a 'hecha' y deja de sugerirse
      sincronizarEstado(tareaActiva, 'hecha');
    },

    continuarTrasLogro: () => {
      const actor = usuarioEnSesion();
      const registro = get().tareasPorUsuario;

      // Descarta pendientes que ya no son válidas (eliminadas, hechas o con app deshabilitada)
      const vigentes = get().pendientes.flatMap((t): Tarea[] => {
        if (!t.usuarioId) return [t]; // Compatibilidad con tareas sin dueño
        const guardada = registro[t.usuarioId]?.find((g) => g.id === t.id);
        if (!guardada) return [];
        const disponible = actor ? esSugerible(guardada, actor) : guardada.estado === 'pendiente';
        return disponible ? [guardada] : [];
      });

      const res = continuarLogro(vigentes);
      set({
        tareaActiva: res.siguienteActiva,
        pendientes: res.nuevasPendientes,
        enLogro: res.enLogro,
        ultimaTerminada: res.ultimaTerminada,
        segundosTranscurridos: res.segundosTranscurridos,
        estado: res.estado,
      });
      sincronizarEstado(res.siguienteActiva, 'en-curso');
    },

    avanzar: (segundos) =>
      set((state) => {
        if (state.estado === 'pausada' || !state.tareaActiva) return state;
        const limite = state.tareaActiva.minutos * 60;
        const nuevoTiempo = Math.min(state.segundosTranscurridos + segundos, limite);
        return { segundosTranscurridos: nuevoTiempo };
      }),

    inicializarUsuario: (usuarioId) => {
      const id = usuarioId ?? useSesion.getState().usuario?.id;
      if (!id) return;

      const { tareasPorUsuario, inicializadas } = get();
      if (inicializadas[id]) {
        set({ sugerenciaActualId: null });
        return;
      }

      // Si ya tiene tareas (por ejemplo, migradas), solo se marca como inicializado
      const actuales = tareasPorUsuario[id] ?? [];
      const lista =
        actuales.length > 0 ? actuales : instanciarSemillas(id, Date.now(), crearIdTarea);

      const nuevoRegistro = { ...tareasPorUsuario, [id]: lista };
      const nuevasInicializadas = { ...inicializadas, [id]: true };
      set({
        tareasPorUsuario: nuevoRegistro,
        inicializadas: nuevasInicializadas,
        sugerenciaActualId: null,
      });
      persistir(nuevoRegistro, nuevasInicializadas);
    },

    crear: (datos) =>
      operar(
        null,
        (actor, tareas) =>
          opCrearTarea(actor, tareas, datos, { id: crearIdTarea(), ahora: Date.now() }),
        (titulo) => `Tarea creada: ${titulo}`
      ),

    editar: (tareaId, cambios) =>
      operar(
        tareaId,
        (actor, tareas) => opEditarTarea(actor, tareas, tareaId, cambios),
        (titulo) => `Tarea editada: ${titulo}`
      ),

    eliminar: (tareaId) =>
      operar(
        tareaId,
        (actor, tareas) => opEliminarTarea(actor, tareas, tareaId),
        (titulo) => `Tarea eliminada: ${titulo}`
      ),

    marcarHecha: (tareaId) => {
      const actor = usuarioEnSesion();
      if (!actor) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.SIN_SESION };
      const registro = get().tareasPorUsuario;
      if (esTareaAjena(registro, actor.id, tareaId)) {
        return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO };
      }
      const resultado = opMarcarHecha(actor, registro[actor.id] ?? [], tareaId);
      if (resultado.ok) guardarListaDe(actor.id, resultado.tareas);
      return resultado;
    },

    empezarTarea: (tareaId) => {
      const actor = usuarioEnSesion();
      if (!actor) return { ok: false, motivo: MOTIVOS_ERROR_TAREAS.SIN_SESION };

      const registro = get().tareasPorUsuario;
      const lista = registro[actor.id] ?? [];
      const tarea = lista.find((t) => t.id === tareaId);
      if (!tarea) {
        return {
          ok: false,
          motivo: esTareaAjena(registro, actor.id, tareaId)
            ? MOTIVOS_ERROR_TAREAS.NO_ES_DUENO
            : MOTIVOS_ERROR_TAREAS.TAREA_NO_EXISTE,
        };
      }

      const decision = puedeEmpezarTarea(tarea, actor);
      if (!decision.ok) return decision;

      const resto = ordenarSugerencias(
        lista.filter((t) => t.id !== tareaId && esSugerible(t, actor))
      );
      get().empezar(tarea, resto);
      return { ok: true };
    },

    otraSugerencia: () => {
      const actor = usuarioEnSesion();
      if (!actor) return;
      const state = get();
      const actual = seleccionarSugerenciaActual(state, actor).tarea;
      const siguiente = siguienteSugerencia(seleccionarSugeribles(state, actor), actual?.id ?? null);
      set({ sugerenciaActualId: siguiente.tarea?.id ?? null });
    },

    liberarTareasEnCurso: (usuarioId) => {
      const id = usuarioId ?? useSesion.getState().usuario?.id;
      if (!id) return;
      const lista = get().tareasPorUsuario[id];
      if (!lista?.some((t) => t.estado === 'en-curso' || t.estado === 'pausada')) return;
      guardarListaDe(
        id,
        lista.map((t) =>
          t.estado === 'en-curso' || t.estado === 'pausada' ? { ...t, estado: 'pendiente' } : t
        )
      );
    },
  };
});
