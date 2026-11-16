import { describe, it, expect } from 'vitest';
import {
  validarTarea,
  crearTarea,
  editarTarea,
  eliminarTarea,
  marcarHecha,
  normalizarEtiqueta,
  puedeEmpezarTarea,
  migrarDatosTareas,
} from './operaciones';
import { Usuario, TareaGestionada } from '../types';
import {
  ETIQUETA_POR_DEFECTO,
  LONGITUD_MAX_ETIQUETA,
  LONGITUD_MAX_TITULO,
  MAXIMO_TAREAS_PENDIENTES,
  MOTIVOS_ERROR_TAREAS,
  VERSION_DATOS_TAREAS,
} from '../../config/tareas';

function crearUsuario(id: string, appsHabilitadas: Usuario['limites']['appsHabilitadas'] = ['focuspad', 'tagfs']): Usuario {
  return {
    id,
    nombre: id,
    inicial: id[0].toUpperCase(),
    rol: 'estandar',
    pin: '1234',
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      appsHabilitadas,
      maxTareasActivas: 3,
      memoriaMaximaMb: 1024,
    },
  };
}

function crearTareaGestionada(
  overrides: Partial<TareaGestionada> = {}
): TareaGestionada {
  return {
    id: 't1',
    usuarioId: 'ana',
    titulo: 'Leer apuntes',
    app: 'focuspad',
    minutos: 15,
    etiqueta: 'estudio',
    importante: false,
    estado: 'pendiente',
    creadaEn: 1000,
    ...overrides,
  };
}

describe('operaciones de tareas (kernel)', () => {
  const ana = crearUsuario('ana');
  const luis = crearUsuario('luis');

  describe('normalizarEtiqueta y validarTarea', () => {
    it('acepta datos válidos, recorta título y normaliza etiqueta', () => {
      const res = validarTarea(
        {
          titulo: '   Repasar tema 1   ',
          app: 'focuspad',
          minutos: 25,
          etiqueta: '  #Mi Estudio  ',
          importante: true,
        },
        ana
      );

      expect(res).toEqual({
        ok: true,
        datos: {
          titulo: 'Repasar tema 1',
          app: 'focuspad',
          minutos: 25,
          etiqueta: 'miestudio',
          importante: true,
        },
      });
    });

    it('usa etiqueta por defecto cuando viene vacía o solo con espacios y #', () => {
      expect(normalizarEtiqueta('')).toBe(ETIQUETA_POR_DEFECTO);
      expect(normalizarEtiqueta('   ###  ')).toBe(ETIQUETA_POR_DEFECTO);

      const res = validarTarea(
        { titulo: 'Tarea', app: 'focuspad', minutos: 10, etiqueta: '  # ' },
        ana
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.datos.etiqueta).toBe(ETIQUETA_POR_DEFECTO);
      }
    });

    it('rechaza título vacío o que supere LONGITUD_MAX_TITULO', () => {
      expect(
        validarTarea({ titulo: '   ', app: 'focuspad', minutos: 10 }, ana)
      ).toEqual({ ok: false, motivo: MOTIVOS_ERROR_TAREAS.TITULO_VACIO });

      expect(
        validarTarea(
          { titulo: 'a'.repeat(LONGITUD_MAX_TITULO + 1), app: 'focuspad', minutos: 10 },
          ana
        )
      ).toEqual({ ok: false, motivo: MOTIVOS_ERROR_TAREAS.TITULO_MUY_LARGO });
    });

    it('rechaza app no habilitada para el usuario', () => {
      const res = validarTarea(
        { titulo: 'Escuchar lluvia', app: 'ambient', minutos: 15 },
        ana
      );
      expect(res).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA,
      });
    });

    it('rechaza duración fuera de DURACIONES_PERMITIDAS', () => {
      const res = validarTarea(
        { titulo: 'Tarea corta', app: 'focuspad', minutos: 5 },
        ana
      );
      expect(res).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.DURACION_INVALIDA,
      });
    });

    it('rechaza etiqueta con caracteres raros o demasiado larga', () => {
      expect(
        validarTarea(
          { titulo: 'Tarea', app: 'focuspad', minutos: 10, etiqueta: 'trabajo$1!' },
          ana
        )
      ).toEqual({ ok: false, motivo: MOTIVOS_ERROR_TAREAS.ETIQUETA_INVALIDA });

      expect(
        validarTarea(
          {
            titulo: 'Tarea',
            app: 'focuspad',
            minutos: 10,
            etiqueta: 'a'.repeat(LONGITUD_MAX_ETIQUETA + 1),
          },
          ana
        )
      ).toEqual({ ok: false, motivo: MOTIVOS_ERROR_TAREAS.ETIQUETA_MUY_LARGA });
    });
  });

  describe('crearTarea', () => {
    it('crea una tarea pendiente para el actor', () => {
      const res = crearTarea(
        ana,
        [],
        { titulo: 'Nueva', app: 'focuspad', minutos: 15, etiqueta: '#Focus' },
        { id: 't-nueva', ahora: 5000 }
      );

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.tarea).toEqual({
          id: 't-nueva',
          usuarioId: 'ana',
          titulo: 'Nueva',
          app: 'focuspad',
          minutos: 15,
          etiqueta: 'focus',
          importante: false,
          estado: 'pendiente',
          creadaEn: 5000,
        });
        expect(res.tareas).toHaveLength(1);
      }
    });

    it('respeta MAXIMO_TAREAS_PENDIENTES pero ignora las tareas hechas', () => {
      const hechas = Array.from({ length: 3 }, (_, i) =>
        crearTareaGestionada({ id: `h-${i}`, estado: 'hecha' })
      );
      const pendientes = Array.from({ length: MAXIMO_TAREAS_PENDIENTES }, (_, i) =>
        crearTareaGestionada({ id: `p-${i}`, estado: 'pendiente' })
      );

      const resLleno = crearTarea(
        ana,
        [...hechas, ...pendientes],
        { titulo: 'Extra', app: 'focuspad', minutos: 10 },
        { id: 'extra', ahora: 2000 }
      );
      expect(resLleno).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.MAXIMO_PENDIENTES,
      });
    });
  });

  describe('editarTarea y eliminarTarea', () => {
    it('impide editar o eliminar si está en-curso o pausada', () => {
      const enCurso = crearTareaGestionada({ id: 't1', estado: 'en-curso' });
      const pausada = crearTareaGestionada({ id: 't2', estado: 'pausada' });

      expect(editarTarea(ana, [enCurso], 't1', { titulo: 'Otro' })).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
      });
      expect(editarTarea(ana, [pausada], 't2', { titulo: 'Otro' })).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
      });
      expect(eliminarTarea(ana, [enCurso], 't1')).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
      });
      expect(eliminarTarea(ana, [pausada], 't2')).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.TAREA_EN_USO,
      });
    });

    it('solo el dueño puede editar o eliminar la tarea', () => {
      const tAna = crearTareaGestionada({ id: 't1', usuarioId: 'ana' });

      expect(editarTarea(luis, [tAna], 't1', { titulo: 'Hack' })).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO,
      });
      expect(eliminarTarea(luis, [tAna], 't1')).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.NO_ES_DUENO,
      });
    });

    it('permite editar y eliminar una tarea pendiente del dueño', () => {
      const tAna = crearTareaGestionada({ id: 't1', usuarioId: 'ana' });

      const editada = editarTarea(ana, [tAna], 't1', {
        titulo: 'Actualizada',
        importante: true,
      });
      expect(editada.ok).toBe(true);
      if (editada.ok) {
        expect(editada.tarea.titulo).toBe('Actualizada');
        expect(editada.tarea.importante).toBe(true);
      }

      const eliminada = eliminarTarea(ana, [tAna], 't1');
      expect(eliminada.ok).toBe(true);
      if (eliminada.ok) {
        expect(eliminada.tareas).toEqual([]);
      }
    });
  });

  describe('marcarHecha y puedeEmpezarTarea', () => {
    it('marca como hecha una tarea propia y rechaza si ya estaba hecha', () => {
      const tAna = crearTareaGestionada({ id: 't1', usuarioId: 'ana' });
      const res = marcarHecha(ana, [tAna], 't1');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.tarea.estado).toBe('hecha');
        expect(marcarHecha(ana, res.tareas, 't1')).toEqual({
          ok: false,
          motivo: MOTIVOS_ERROR_TAREAS.TAREA_YA_HECHA,
        });
      }
    });

    it('rechaza empezar tarea cuya app fue deshabilitada', () => {
      const t = crearTareaGestionada({ app: 'ambient' });
      expect(puedeEmpezarTarea(t, ana)).toEqual({
        ok: false,
        motivo: MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA,
      });
    });
  });

  describe('migrarDatosTareas', () => {
    it('migra un registro antiguo sin versión y vuelve en-curso a pendiente', () => {
      const antiguo = {
        valery: [
          {
            id: 'old-1',
            titulo: 'Vieja',
            app: 'focuspad',
            minutos: 15,
            etiqueta: 'estudio',
            estado: 'en-curso',
          },
        ],
      };

      const migrado = migrarDatosTareas(antiguo);
      expect(migrado.version).toBe(VERSION_DATOS_TAREAS);
      expect(migrado.inicializadas).toEqual({ valery: true });
      expect(migrado.tareasPorUsuario.valery[0]).toMatchObject({
        id: 'old-1',
        usuarioId: 'valery',
        estado: 'pendiente',
        importante: false,
      });
    });
  });
});
