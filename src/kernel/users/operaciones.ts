import { LimitesUsuario, RolUsuario, Usuario } from '../types';
import {
  LIMITES_USUARIO_POR_DEFECTO,
  MAX_MEMORIA_USUARIO_MB,
  MAX_TAREAS_ACTIVAS,
  MIN_MEMORIA_USUARIO_MB,
  MIN_TAREAS_ACTIVAS,
  MOTIVOS_ERROR_USUARIOS,
} from './constantes';

export type ResultadoOperacionUsuario =
  | { ok: true; usuario: Usuario; usuarios: Usuario[] }
  | { ok: false; motivo: string };

export type DatosCrearUsuario = {
  nombre: string;
  pin: string;
  rol: RolUsuario;
  limites?: Partial<LimitesUsuario>;
  foto?: string;
};

/** Valida si el actor tiene privilegios de administrador y su cuenta está activa. */
function esActorAdminActivo(actor: Usuario): boolean {
  return actor.rol === 'admin' && actor.estado === 'activo';
}

/**
 * Valida los límites configurados asegurando que estén dentro de los rangos permitidos por el kernel.
 */
export function validarLimites(limites: Partial<LimitesUsuario>): boolean {
  if (limites.maxTareasActivas !== undefined) {
    if (
      limites.maxTareasActivas < MIN_TAREAS_ACTIVAS ||
      limites.maxTareasActivas > MAX_TAREAS_ACTIVAS
    ) {
      return false;
    }
  }

  if (limites.memoriaMaximaMb !== undefined) {
    if (
      limites.memoriaMaximaMb < MIN_MEMORIA_USUARIO_MB ||
      limites.memoriaMaximaMb > MAX_MEMORIA_USUARIO_MB
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Crea un nuevo usuario en el sistema.
 * El actor debe ser administrador activo. Valida nombre no vacío, único y PIN de 4 dígitos.
 */
export function crearUsuario(
  actor: Usuario,
  usuarios: readonly Usuario[],
  datos: DatosCrearUsuario
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  const nombreLimpio = datos.nombre.trim();
  if (nombreLimpio.length === 0) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.NOMBRE_VACIO };
  }

  const nombreDuplicado = usuarios.some(
    (u) => u.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
  );
  if (nombreDuplicado) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.NOMBRE_DUPLICADO };
  }

  if (!/^\d{4}$/.test(datos.pin)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.PIN_INVALIDO };
  }

  if (datos.limites && !validarLimites(datos.limites)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.LIMITES_FUERA_DE_RANGO };
  }

  const idGenerado = nombreLimpio
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-');

  const nuevoUsuario: Usuario = {
    id: idGenerado || `usr-${Date.now()}`,
    nombre: nombreLimpio,
    inicial: nombreLimpio.charAt(0).toUpperCase() || 'U',
    rol: datos.rol,
    pin: datos.pin,
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      ...LIMITES_USUARIO_POR_DEFECTO,
      ...(datos.limites ?? {}),
    },
    ...(datos.foto ? { foto: datos.foto } : {}),
  };

  return {
    ok: true,
    usuario: nuevoUsuario,
    usuarios: [...usuarios, nuevoUsuario],
  };
}

/**
 * Bloquea la cuenta de un usuario.
 * Nadie puede bloquearse a sí mismo ni se puede bloquear al último administrador activo.
 */
export function bloquearUsuario(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioId: string
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  if (actor.id === usuarioId) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.AUTO_BLOQUEO_NO_PERMITIDO };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioId);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_ENCONTRADO };
  }

  // Comprobar si es el último administrador activo
  if (objetivo.rol === 'admin' && objetivo.estado === 'activo') {
    const otrosAdminsActivos = usuarios.filter(
      (u) => u.id !== usuarioId && u.rol === 'admin' && u.estado === 'activo'
    );
    if (otrosAdminsActivos.length === 0) {
      return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMINISTRADOR };
    }
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    estado: 'bloqueado',
  };

  const listaActualizada = usuarios.map((u) =>
    u.id === usuarioId ? usuarioActualizado : u
  );

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: listaActualizada,
  };
}

/**
 * Desbloquea la cuenta de un usuario previamente bloqueado.
 */
export function desbloquearUsuario(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioId: string
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioId);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_ENCONTRADO };
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    estado: 'activo',
  };

  const listaActualizada = usuarios.map((u) =>
    u.id === usuarioId ? usuarioActualizado : u
  );

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: listaActualizada,
  };
}

/**
 * Cambia el rol de un usuario ('estandar' | 'admin').
 * No permite degradar al último administrador activo.
 */
export function cambiarRol(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioId: string,
  nuevoRol: RolUsuario
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioId);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_ENCONTRADO };
  }

  // Comprobar si se degrada al último administrador activo
  if (objetivo.rol === 'admin' && nuevoRol !== 'admin' && objetivo.estado === 'activo') {
    const otrosAdminsActivos = usuarios.filter(
      (u) => u.id !== usuarioId && u.rol === 'admin' && u.estado === 'activo'
    );
    if (otrosAdminsActivos.length === 0) {
      return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMINISTRADOR };
    }
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    rol: nuevoRol,
  };

  const listaActualizada = usuarios.map((u) =>
    u.id === usuarioId ? usuarioActualizado : u
  );

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: listaActualizada,
  };
}

/**
 * Actualiza los límites asignados a un usuario tras validar los rangos permitidos.
 */
export function actualizarLimites(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioId: string,
  nuevosLimites: Partial<LimitesUsuario>
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioId);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_ENCONTRADO };
  }

  if (!validarLimites(nuevosLimites)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.LIMITES_FUERA_DE_RANGO };
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    limites: {
      ...objetivo.limites,
      ...nuevosLimites,
    },
  };

  const listaActualizada = usuarios.map((u) =>
    u.id === usuarioId ? usuarioActualizado : u
  );

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: listaActualizada,
  };
}
