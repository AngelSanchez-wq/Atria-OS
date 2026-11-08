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
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.LIMITES_INVALIDOS };
  }

  const idGenerado = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const inicial = nombreLimpio.charAt(0).toUpperCase();

  const nuevoUsuario: Usuario = {
    id: idGenerado,
    nombre: nombreLimpio,
    inicial,
    rol: datos.rol,
    pin: datos.pin, // TODO: Guardar hash con sal en lugar de texto plano
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      ...LIMITES_USUARIO_POR_DEFECTO,
      ...(datos.limites ?? {}),
    },
    foto: datos.foto,
  };

  return {
    ok: true,
    usuario: nuevoUsuario,
    usuarios: [...usuarios, nuevoUsuario],
  };
}

/**
 * Bloquea la cuenta de un usuario.
 * Reglas de seguridad:
 * - El actor debe ser administrador activo.
 * - Nadie puede bloquearse a sí mismo.
 * - No se puede bloquear al último administrador activo del sistema.
 * - Nota de diseño: Si el administrador bloquea a un usuario que tiene actualmente una sesión
 *   activa, la acción NO lo expulsa inmediatamente; solo surte efecto e impide el acceso
 *   en su próximo inicio de sesión.
 */
export function bloquearUsuario(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioIdABloquear: string
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  if (actor.id === usuarioIdABloquear) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.AUTO_BLOQUEO_NO_PERMITIDO };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioIdABloquear);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE };
  }

  // Comprobar si es el último admin activo
  if (objetivo.rol === 'admin' && objetivo.estado === 'activo') {
    const otrosAdminsActivos = usuarios.filter(
      (u) => u.id !== objetivo.id && u.rol === 'admin' && u.estado === 'activo'
    );
    if (otrosAdminsActivos.length === 0) {
      return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMIN_ACTIVO };
    }
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    estado: 'bloqueado',
  };

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: usuarios.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u)),
  };
}

/**
 * Desbloquea la cuenta de un usuario previamente bloqueado.
 * El actor debe ser administrador activo.
 */
export function desbloquearUsuario(
  actor: Usuario,
  usuarios: readonly Usuario[],
  usuarioIdADesbloquear: string
): ResultadoOperacionUsuario {
  if (!esActorAdminActivo(actor)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ACTOR_NO_ADMIN };
  }

  const objetivo = usuarios.find((u) => u.id === usuarioIdADesbloquear);
  if (!objetivo) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE };
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    estado: 'activo',
  };

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: usuarios.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u)),
  };
}

/**
 * Cambia el rol de un usuario (de 'estandar' a 'admin' o viceversa).
 * Reglas de seguridad:
 * - El actor debe ser administrador activo.
 * - No se puede degradar al último administrador activo del sistema.
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
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE };
  }

  if (objetivo.rol === nuevoRol) {
    return { ok: true, usuario: objetivo, usuarios: [...usuarios] };
  }

  // Si se degrada de admin a estandar, validar que no sea el último admin activo
  if (objetivo.rol === 'admin' && nuevoRol === 'estandar') {
    const otrosAdminsActivos = usuarios.filter(
      (u) => u.id !== objetivo.id && u.rol === 'admin' && u.estado === 'activo'
    );
    if (otrosAdminsActivos.length === 0) {
      return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.ULTIMO_ADMIN_ACTIVO };
    }
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    rol: nuevoRol,
  };

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: usuarios.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u)),
  };
}

/**
 * Actualiza los límites (apps habilitadas, tareas y memoria) de un usuario.
 * El actor debe ser administrador activo y los valores deben estar en el rango válido.
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
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.USUARIO_NO_EXISTE };
  }

  if (!validarLimites(nuevosLimites)) {
    return { ok: false, motivo: MOTIVOS_ERROR_USUARIOS.LIMITES_INVALIDOS };
  }

  const usuarioActualizado: Usuario = {
    ...objetivo,
    limites: {
      ...objetivo.limites,
      ...nuevosLimites,
    },
  };

  return {
    ok: true,
    usuario: usuarioActualizado,
    usuarios: usuarios.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u)),
  };
}
