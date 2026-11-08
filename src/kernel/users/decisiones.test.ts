import { describe, it, expect } from 'vitest';
import { PCB, Usuario } from '../types';
import { puedeAbrirApp, cupoDeTareas, puedeIniciarSesion } from './decisiones';
import { LIMITES_USUARIO_POR_DEFECTO, MOTIVOS_RECHAZO_APP } from './constantes';
import { MEMORIA_TOTAL_MB, PROCESO_KERNEL_BASE } from '../processes/constantes';

const usuarioBase: Usuario = {
  id: 'usr-mateo',
  nombre: 'Mateo',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
  estado: 'activo',
  ultimoAcceso: null,
  limites: {
    ...LIMITES_USUARIO_POR_DEFECTO,
    appsHabilitadas: ['focuspad', 'timelapse', 'burble'],
    maxTareasActivas: 4,
    memoriaMaximaMb: 512,
  },
};

describe('Funciones puras de decisión del kernel de usuarios', () => {
  describe('puedeAbrirApp', () => {
    it('permite abrir app si está habilitada y hay memoria suficiente', () => {
      const res = puedeAbrirApp(usuarioBase, 'focuspad', [PROCESO_KERNEL_BASE]);
      expect(res.ok).toBe(true);
    });

    it('rechaza apertura si la app no está en sus appsHabilitadas', () => {
      // 'tagfs' no está en la lista de appsHabilitadas de usuarioBase
      const res = puedeAbrirApp(usuarioBase, 'tagfs', [PROCESO_KERNEL_BASE]);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_RECHAZO_APP.APP_DESHABILITADA);
      }
    });

    it('rechaza apertura si los procesos del usuario exceden su memoria máxima asignada', () => {
      // FocusPad requiere 256 MB. Usuario tiene límite de 512 MB.
      // Si el usuario ya tiene procesos vivos sumando 300 MB, 300 + 256 = 556 > 512
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'burble',
          estado: 'En ejecución',
          prioridad: 3,
          memoriaMb: 300,
          usuarioId: usuarioBase.id,
          creadoEn: 100,
          tipoApp: 'interna',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_RECHAZO_APP.MEMORIA_INSUFICIENTE);
      }
    });

    it('permite abrir app cuando la memoria queda exactamente en el límite del usuario', () => {
      // FocusPad requiere 256 MB. Usuario límite 512 MB.
      // Proceso existente del usuario usa exactamente 256 MB. 256 + 256 = 512 === límite
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'timelapse',
          estado: 'En ejecución',
          prioridad: 7,
          memoriaMb: 256,
          usuarioId: usuarioBase.id,
          creadoEn: 100,
          tipoApp: 'web',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(true);
    });

    it('no computa los procesos de otros usuarios en el límite individual del usuario', () => {
      // Otro usuario tiene un proceso pesado de 400 MB
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'focuspad',
          estado: 'En ejecución',
          prioridad: 8,
          memoriaMb: 400,
          usuarioId: 'otro-usuario',
          creadoEn: 100,
          tipoApp: 'web',
        },
      ];

      // Para usuarioBase, su memoria usada es 0 MB, por lo que 0 + 256 <= 512
      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(true);
    });

    it('rechaza si la memoria total global del sistema físico se satura', () => {
      // Llenamos la memoria física casi al límite total
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'focuspad',
          estado: 'En ejecución',
          prioridad: 8,
          memoriaMb: MEMORIA_TOTAL_MB - PROCESO_KERNEL_BASE.memoriaMb - 10,
          usuarioId: 'otro-usuario',
          creadoEn: 100,
          tipoApp: 'web',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_RECHAZO_APP.MEMORIA_INSUFICIENTE);
      }
    });

    it('ignora procesos terminados al calcular la memoria consumida', () => {
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'burble',
          estado: 'Terminado',
          prioridad: 3,
          memoriaMb: 500,
          usuarioId: usuarioBase.id,
          creadoEn: 100,
          tipoApp: 'interna',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(true);
    });
  });

  describe('cupoDeTareas', () => {
    it('obtiene el cupo configurado en el perfil del usuario', () => {
      expect(cupoDeTareas(usuarioBase)).toBe(4);
    });

    it('devuelve el cupo por defecto si el usuario es null', () => {
      expect(cupoDeTareas(null)).toBe(3);
    });
  });

  describe('puedeIniciarSesion', () => {
    it('retorna true para un usuario con estado activo', () => {
      expect(puedeIniciarSesion(usuarioBase)).toBe(true);
    });

    it('retorna false para un usuario con estado bloqueado', () => {
      const usuarioBloqueado: Usuario = {
        ...usuarioBase,
        estado: 'bloqueado',
      };
      expect(puedeIniciarSesion(usuarioBloqueado)).toBe(false);
    });
  });
});
