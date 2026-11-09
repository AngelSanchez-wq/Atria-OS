import { describe, it, expect, beforeEach } from 'vitest';
import { useUsuariosStore, CLAVE_PERSISTENCIA_USUARIOS } from './usuarios';
import { useRegistroStore } from './registro';
import { useSesion } from './sesion';
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

  it('permite cambiar la foto de perfil, persiste, actualiza la sesión activa y registra el evento sin la imagen', () => {
    const estandar = obtenerEstandar();
    useSesion.getState().ingresar(estandar);

    const fotoDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    const res = useUsuariosStore.getState().cambiarFoto(estandar, estandar.id, fotoDataUrl);

    expect(res.ok).toBe(true);

    // Actualiza en el store
    const usuarioEnStore = useUsuariosStore.getState().usuarios.find((u) => u.id === estandar.id);
    expect(usuarioEnStore?.foto).toBe(fotoDataUrl);

    // Persiste en platform
    const persistido = platform.loadState<Usuario[]>(CLAVE_PERSISTENCIA_USUARIOS, []);
    const persistidoUsuario = persistido.find((u) => u.id === estandar.id);
    expect(persistidoUsuario?.foto).toBe(fotoDataUrl);

    // Actualiza inmediatamente la sesión activa
    expect(useSesion.getState().usuario?.foto).toBe(fotoDataUrl);

    // Registra el evento en categoría 'sesion'
    const eventos = useRegistroStore.getState().eventos;
    const evFoto = eventos.find((e) => e.mensaje.includes('Foto de perfil actualizada'));
    expect(evFoto).toBeDefined();
    expect(evFoto?.categoria).toBe('sesion');
    expect(evFoto?.gravedad).toBe('info');

    // ¡NUNCA guarda la imagen ni el data URL en el registro de eventos!
    const registroSerializado = JSON.stringify(eventos);
    expect(registroSerializado).not.toContain(fotoDataUrl);
    expect(registroSerializado).not.toContain('base64');
  });

  it('permite quitar la foto de perfil al propio usuario o un admin, y audita quién la quitó', () => {
    const admin = obtenerAdmin();
    const estandar = obtenerEstandar();

    // Primero iniciamos sesión con el usuario estándar
    useSesion.getState().ingresar(estandar);

    // Asignamos una foto
    const fotoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    useUsuariosStore.getState().cambiarFoto(estandar, estandar.id, fotoDataUrl);

    expect(useSesion.getState().usuario?.foto).toBe(fotoDataUrl);

    // Admin quita la foto del usuario estándar
    const res = useUsuariosStore.getState().quitarFoto(admin, estandar.id);
    expect(res.ok).toBe(true);

    // Desaparece del store
    const usuarioEnStore = useUsuariosStore.getState().usuarios.find((u) => u.id === estandar.id);
    expect(usuarioEnStore?.foto).toBeUndefined();

    // Sesión activa se sincroniza
    expect(useSesion.getState().usuario?.foto).toBeUndefined();

    // Evento auditado indicando la intervención del admin
    const eventos = useRegistroStore.getState().eventos;
    const evQuitar = eventos.find((e) => e.mensaje.includes('Foto de perfil quitada'));
    expect(evQuitar).toBeDefined();
    expect(evQuitar?.categoria).toBe('sesion');
    expect(evQuitar?.mensaje).toContain(admin.nombre);

    // No hay data URLs
    expect(JSON.stringify(eventos)).not.toContain('base64');
  });
});
