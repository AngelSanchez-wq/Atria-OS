import { describe, it, expect, beforeEach } from 'vitest';
import { useUsuariosStore, CLAVE_PERSISTENCIA_USUARIOS } from './usuarios';
import { useRegistroStore } from './registro';
import { platform } from '../platform/web';
import { Usuario } from '../kernel/types';

describe('useUsuariosStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRegistroStore.getState().limpiar();
    useUsuariosStore.getState().restablecer();
  });

  const obtenerAdmin = (): Usuario => {
    const admin = useUsuariosStore.getState().usuarios.find((u) => u.rol === 'admin');
    if (!admin) throw new Error('No hay admin en semillas');
    return admin;
  };

  const obtenerEstandar = (): Usuario => {
    const usr = useUsuariosStore.getState().usuarios.find((u) => u.rol === 'estandar');
    if (!usr) throw new Error('No hay usuario estándar en semillas');
    return usr;
  };

  it('inicializa con los usuarios semilla y los persiste', () => {
    const usuarios = useUsuariosStore.getState().usuarios;
    expect(usuarios.length).toBeGreaterThanOrEqual(3);

    const persistido = platform.loadState<Usuario[]>(CLAVE_PERSISTENCIA_USUARIOS, []);
    expect(persistido).toHaveLength(usuarios.length);
  });

  it('permite al administrador crear un nuevo usuario y lo persiste y audita', () => {
    const admin = obtenerAdmin();
    const res = useUsuariosStore.getState().crearUsuario(admin, {
      nombre: 'Lucía',
      pin: '4321',
      rol: 'estandar',
    });

    expect(res.ok).toBe(true);
    const usuarios = useUsuariosStore.getState().usuarios;
    const lucia = usuarios.find((u) => u.nombre === 'Lucía');
    expect(lucia).toBeDefined();

    // Persistencia
    const persistido = platform.loadState<Usuario[]>(CLAVE_PERSISTENCIA_USUARIOS, []);
    expect(persistido.some((u) => u.nombre === 'Lucía')).toBe(true);

    // Registro de eventos
    const eventos = useRegistroStore.getState().eventos;
    const evCreacion = eventos.find((e) => e.mensaje.includes('Usuario creado: Lucía'));
    expect(evCreacion).toBeDefined();
    expect(evCreacion?.categoria).toBe('seguridad');
    expect(evCreacion?.gravedad).toBe('info');
    // Nunca registra el PIN
    expect(JSON.stringify(eventos)).not.toContain('4321');
  });

  it('bloquea y desbloquea usuarios con persistencia y auditoría', () => {
    const admin = obtenerAdmin();
    const estandar = obtenerEstandar();

    // Bloquear
    const resBloqueo = useUsuariosStore.getState().bloquearUsuario(admin, estandar.id);
    expect(resBloqueo.ok).toBe(true);

    let usuarioActual = useUsuariosStore.getState().usuarios.find((u) => u.id === estandar.id);
    expect(usuarioActual?.estado).toBe('bloqueado');

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.some((e) => e.mensaje.includes('Usuario bloqueado'))).toBe(true);

    // Desbloquear
    const resDesbloqueo = useUsuariosStore.getState().desbloquearUsuario(admin, estandar.id);
    expect(resDesbloqueo.ok).toBe(true);

    usuarioActual = useUsuariosStore.getState().usuarios.find((u) => u.id === estandar.id);
    expect(usuarioActual?.estado).toBe('activo');
  });

  it('actualiza el último acceso del usuario al iniciar sesión', () => {
    const estandar = obtenerEstandar();
    const ahora = 1700000000000;

    useUsuariosStore.getState().actualizarUltimoAcceso(estandar.id, ahora);

    const usuarioActual = useUsuariosStore.getState().usuarios.find((u) => u.id === estandar.id);
    expect(usuarioActual?.ultimoAcceso).toBe(ahora);

    const persistido = platform.loadState<Usuario[]>(CLAVE_PERSISTENCIA_USUARIOS, []);
    const persistidoUsuario = persistido.find((u) => u.id === estandar.id);
    expect(persistidoUsuario?.ultimoAcceso).toBe(ahora);
  });
});
