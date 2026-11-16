import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useTareas,
  seleccionarPendientes,
  seleccionarSugerenciaActual,
  seleccionarSugeribles,
} from './tareas';
import { useSesion } from './sesion';
import { useUsuariosStore } from './usuarios';
import { useRegistroStore } from './registro';
import { Tarea, Usuario } from '../kernel/types';
import { USUARIOS_SEMILLA } from '../kernel/users/usuarios-semilla';
import {
  CLAVE_PERSISTENCIA_TAREAS,
  MOTIVOS_ERROR_TAREAS,
  VERSION_DATOS_TAREAS,
} from '../config/tareas';
import { platform } from '../platform/web';

describe('Store Tareas', () => {
  const tareaMock = { id: '1', minutos: 10 } as Tarea;
  const tareaSiguiente = { id: '2', minutos: 5 } as Tarea;

  const valery: Usuario = USUARIOS_SEMILLA[0];
  const admin: Usuario = USUARIOS_SEMILLA[2];

  beforeEach(() => {
    localStorage.clear();
    useUsuariosStore.getState().restablecer();
    useRegistroStore.getState().limpiar();
    useSesion.setState({ usuario: null });
    useTareas.setState({
      tareaActiva: null,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: [],
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
      tareasPorUsuario: {},
      inicializadas: {},
      sugerenciaActualId: null,
    });
  });

  // ─── Flujos existentes del escritorio ──────────────────────────────────────

  it('empezar setea la tarea y resetea contadores', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock, [tareaSiguiente]);
    });
    const estadoActual = useTareas.getState();
    expect(estadoActual.tareaActiva).toEqual(tareaMock);
    expect(estadoActual.pendientes).toEqual([tareaSiguiente]);
    expect(estadoActual.segundosTranscurridos).toBe(0);
    expect(estadoActual.estado).toBe('en-curso');
  });

  it('pausar y reanudar cambian el estado', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock);
      useTareas.getState().pausar();
    });
    expect(useTareas.getState().estado).toBe('pausada');

    act(() => {
      useTareas.getState().reanudar();
    });
    expect(useTareas.getState().estado).toBe('en-curso');
  });

  it('avanzar suma tiempo si está en curso y no pasa del límite', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock); // 10 min = 600 seg
      useTareas.getState().avanzar(10);
    });
    expect(useTareas.getState().segundosTranscurridos).toBe(10);

    act(() => {
      useTareas.getState().avanzar(1000);
    });
    expect(useTareas.getState().segundosTranscurridos).toBe(600);
  });

  it('avanzar no suma si está en pausa', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock);
      useTareas.getState().pausar();
      useTareas.getState().avanzar(10);
    });
    expect(useTareas.getState().segundosTranscurridos).toBe(0);
  });

  it('terminar activa el estado de logro y guarda la última tarea terminada', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock, [tareaSiguiente]);
      useTareas.getState().avanzar(120);
      useTareas.getState().terminar();
    });

    const estado = useTareas.getState();
    expect(estado.enLogro).toBe(true);
    expect(estado.tareaActiva).toBeNull();
    expect(estado.ultimaTerminada).toEqual({
      tarea: tareaMock,
      segundosTranscurridos: 120,
    });
    expect(estado.pendientes).toEqual([tareaSiguiente]);
  });

  it('continuarTrasLogro desactiva el logro y activa la siguiente tarea', () => {
    act(() => {
      useTareas.getState().empezar(tareaMock, [tareaSiguiente]);
      useTareas.getState().terminar();
      useTareas.getState().continuarTrasLogro();
    });

    const estado = useTareas.getState();
    expect(estado.enLogro).toBe(false);
    expect(estado.ultimaTerminada).toBeNull();
    expect(estado.tareaActiva).toEqual(tareaSiguiente);
    expect(estado.pendientes).toEqual([]);
    expect(estado.segundosTranscurridos).toBe(0);
  });

  // ─── Gestión por usuario, persistencia, semillas, apps y eventos ───────────

  it('copia las semillas una sola vez al primer ingreso y nunca si se eliminan todas', () => {
    act(() => {
      useSesion.getState().ingresar(valery);
      useTareas.getState().inicializarUsuario(valery.id);
    });

    const iniciales = useTareas.getState().tareasPorUsuario[valery.id];
    expect(iniciales.length).toBeGreaterThan(0);
    expect(iniciales.every((t) => t.usuarioId === valery.id)).toBe(true);
    expect(useTareas.getState().inicializadas[valery.id]).toBe(true);

    // Eliminar todas las tareas del usuario
    act(() => {
      for (const t of iniciales) {
        useTareas.getState().eliminar(t.id);
      }
    });
    expect(useTareas.getState().tareasPorUsuario[valery.id]).toEqual([]);

    // Al volver a ingresar, no se vuelven a copiar las semillas
    act(() => {
      useTareas.getState().inicializarUsuario(valery.id);
    });
    expect(useTareas.getState().tareasPorUsuario[valery.id]).toEqual([]);
  });

  it('aísla las tareas entre usuarios y persiste con platform', () => {
    act(() => {
      useSesion.getState().ingresar(valery);
      useTareas.getState().crear({
        titulo: 'Tarea de Valery',
        app: 'focuspad',
        minutos: 15,
        etiqueta: '#Estudio',
      });

      useSesion.getState().ingresar(admin);
      useTareas.getState().crear({
        titulo: 'Tarea de Admin',
        app: 'tagfs',
        minutos: 25,
      });
    });

    const deValery = useTareas.getState().tareasPorUsuario[valery.id];
    const deAdmin = useTareas.getState().tareasPorUsuario[admin.id];
    expect(deValery.map((t) => t.titulo)).toEqual(['Tarea de Valery']);
    expect(deAdmin.map((t) => t.titulo)).toEqual(['Tarea de Admin']);

    // Admin no puede editar ni eliminar una tarea de Valery
    const idValery = deValery[0].id;
    expect(useTareas.getState().editar(idValery, { titulo: 'Ajena' })).toEqual({
      ok: false,
      motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO,
    });
    expect(useTareas.getState().eliminar(idValery)).toEqual({
      ok: false,
      motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO,
    });

    // Persistencia en platform
    const guardado = platform.loadState<{ version: number; tareasPorUsuario: Record<string, Tarea[]> }>(
      CLAVE_PERSISTENCIA_TAREAS,
      { version: 0, tareasPorUsuario: {} }
    );
    expect(guardado.version).toBe(VERSION_DATOS_TAREAS);
    expect(guardado.tareasPorUsuario[valery.id]).toHaveLength(1);
    expect(guardado.tareasPorUsuario[admin.id]).toHaveLength(1);
  });

  it('impide editar o eliminar una tarea en curso y al terminarla pasa a hecha y deja de sugerirse', () => {
    act(() => {
      useSesion.getState().ingresar(valery);
    });

    let idCreada = '';
    act(() => {
      const res = useTareas.getState().crear({
        titulo: 'Sesión de foco',
        app: 'focuspad',
        minutos: 25,
      });
      if (res.ok) idCreada = res.tarea.id;
    });

    act(() => {
      useTareas.getState().empezarTarea(idCreada);
    });

    expect(useTareas.getState().editar(idCreada, { titulo: 'Cambio' })).toEqual({
      ok: false,
      motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
    });
    expect(useTareas.getState().eliminar(idCreada)).toEqual({
      ok: false,
      motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
    });

    act(() => {
      useTareas.getState().terminar();
    });

    const guardada = useTareas.getState().tareasPorUsuario[valery.id].find((t) => t.id === idCreada);
    expect(guardada?.estado).toBe('hecha');
    expect(seleccionarPendientes(useTareas.getState(), valery)).toEqual([]);
    expect(seleccionarSugerenciaActual(useTareas.getState(), valery).tarea).toBeNull();
  });

  it('mantiene tareas de apps deshabilitadas pero no las sugiere ni permite empezarlas', () => {
    act(() => {
      useSesion.getState().ingresar(valery);
      useTareas.getState().crear({
        titulo: 'Escribir informe',
        app: 'focuspad',
        minutos: 15,
      });
    });

    const idTarea = useTareas.getState().tareasPorUsuario[valery.id][0].id;

    // El administrador deshabilita focuspad para Valery
    act(() => {
      useUsuariosStore.getState().actualizarLimites(admin, valery.id, {
        appsHabilitadas: ['tagfs', 'burble'],
      });
    });

    const valeryActualizada = useUsuariosStore
      .getState()
      .usuarios.find((u) => u.id === valery.id)!;

    // Sigue existiendo en pendientes, pero no en sugeribles
    expect(seleccionarPendientes(useTareas.getState(), valeryActualizada)).toHaveLength(1);
    expect(seleccionarSugeribles(useTareas.getState(), valeryActualizada)).toEqual([]);
    expect(seleccionarSugerenciaActual(useTareas.getState(), valeryActualizada).tarea).toBeNull();

    // No se puede empezar y devuelve el motivo
    expect(useTareas.getState().empezarTarea(idTarea)).toEqual({
      ok: false,
      motivo: MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA,
    });
  });

  it('registra eventos de sesión al crear, editar y eliminar sin datos sensibles', () => {
    act(() => {
      useSesion.getState().ingresar(valery);
    });

    let id = '';
    act(() => {
      const res = useTareas.getState().crear({
        titulo: 'Preparar demo',
        app: 'focuspad',
        minutos: 15,
      });
      if (res.ok) id = res.tarea.id;
      useTareas.getState().editar(id, { titulo: 'Preparar demo v2' });
      useTareas.getState().eliminar(id);
    });

    const mensajes = useRegistroStore
      .getState()
      .eventos.filter((e) => e.categoria === 'sesion')
      .map((e) => e.mensaje);

    expect(mensajes).toEqual([
      'Tarea creada: Preparar demo',
      'Tarea editada: Preparar demo v2',
      'Tarea eliminada: Preparar demo v2',
    ]);
  });
});
