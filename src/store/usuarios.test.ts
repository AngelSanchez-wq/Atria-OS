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
    expect(evCreacion?.mensaje).not.toContain('4321'); // NUNCA el PIN
  });

  it('impide que un usuario estándar ejecute acciones de administración', () => {
    const estandar = obtenerEstandar();
    const res = useUsuariosStore.getState().crearUsuario(estandar, {
      nombre: 'Hacker',
      pin: '9999',
      rol: 'admin',
    });

    expect(res.ok).toBe(false);
    expect(useUsuariosStore.getState().usuarios.some((u) => u.nombre === 'Hacker')).toBe(false);
  });

  it('permite bloquear y desbloquear usuarios persistiendo el estado y auditando', () => {
    const admin = obtenerAdmin();
    const mateo = obtenerEstandar();

    // Bloquear
    const resBloqueo = useUsuariosStore.getState().bloquearUsuario(admin, mateo.id);
    expect(resBloqueo.ok).toBe(true);

    let usuarioActualizado = useUsuariosStore.getState().usuarios.find((u) => u.id === mateo.id);
    expect(usuarioActualizado?.estado).toBe('bloqueado');

    // Desbloquear
    const resDesbloqueo = useUsuariosStore.getState().desbloquearUsuario(admin, mateo.id);
    expect(resDesbloqueo.ok).toBe(true);

    usuarioActualizado = useUsuariosStore.getState().usuarios.find((u) => u.id === mateo.id);
    expect(usuarioActualizado?.estado).toBe('activo');

    // Auditoría
    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.some((e) => e.mensaje.includes('Usuario bloqueado'))).toBe(true);
    expect(eventos.some((e) => e.mensaje.includes('Usuario desbloqueado'))).toBe(true);
  });

  it('permite cambiar rol y actualizar límites', () => {
    const admin = obtenerAdmin();
    const mateo = obtenerEstandar();

    // Cambiar rol
    const resRol = useUsuariosStore.getState().cambiarRol(admin, mateo.id, 'admin');
    expect(resRol.ok).toBe(true);
    expect(useUsuariosStore.getState().usuarios.find((u) => u.id === mateo.id)?.rol).toBe('admin');

    // Actualizar límites
    const resLimites = useUsuariosStore.getState().actualizarLimites(admin, mateo.id, {
      maxTareasActivas: 5,
      memoriaMaximaMb: 1536,
    });
    expect(resLimites.ok).toBe(true);
    const mateoActual = useUsuariosStore.getState().usuarios.find((u) => u.id === mateo.id);
    expect(mateoActual?.limites.maxTareasActivas).toBe(5);
    expect(mateoActual?.limites.memoriaMaximaMb).toBe(1536);
  });

  it('actualiza ultimoAcceso y persiste', () => {
    const admin = obtenerAdmin();
    const instante = 1700000000000;

    useUsuariosStore.getState().actualizarUltimoAcceso(admin.id, instante);

    const adminActual = useUsuariosStore.getState().usuarios.find((u) => u.id === admin.id);
    expect(adminActual?.ultimoAcceso).toBe(instante);

    const persistido = platform.loadState<Usuario[]>(CLAVE_PERSISTENCIA_USUARIOS, []);
    const adminPersistido = persistido.find((u) => u.id === admin.id);
    expect(adminPersistido?.ultimoAcceso).toBe(instante);
  });
});
