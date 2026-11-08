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

    it('permite abrir si los procesos sumados están justo en el límite de memoria', () => {
      // Usuario tiene límite de 512 MB.
      // Proceso actual usa 256 MB. FocusPad requiere 256 MB. 256 + 256 = 512 <= 512.
      const procesosExistentes: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'burble',
          estado: 'En ejecución',
          prioridad: 3,
          memoriaMb: 256,
          usuarioId: usuarioBase.id,
          creadoEn: 100,
          tipoApp: 'interna',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosExistentes);
      expect(res.ok).toBe(true);
    });

    it('rechaza apertura si la memoria total global del sistema no alcanza', () => {
      // FocusPad requiere 256 MB. Si otros procesos ya usan MEMORIA_TOTAL_MB - 100
      const procesosSaturados: PCB[] = [
        PROCESO_KERNEL_BASE,
        {
          pid: 2,
          nombre: 'ambient',
          estado: 'En ejecución',
          prioridad: 2,
          memoriaMb: MEMORIA_TOTAL_MB - 100,
          usuarioId: 'otro-usuario',
          creadoEn: 50,
          tipoApp: 'interna',
        },
      ];

      const res = puedeAbrirApp(usuarioBase, 'focuspad', procesosSaturados);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.motivo).toBe(MOTIVOS_RECHAZO_APP.MEMORIA_INSUFICIENTE);
      }
    });
  });

  describe('cupoDeTareas', () => {
    it('obtiene el límite de tareas configurado para el usuario', () => {
      expect(cupoDeTareas(usuarioBase)).toBe(4);
    });

    it('devuelve el valor por defecto si el usuario es null', () => {
      expect(cupoDeTareas(null)).toBe(3);
    });
  });

  describe('puedeIniciarSesion', () => {
    it('permite iniciar sesión si el usuario está activo', () => {
      expect(puedeIniciarSesion(usuarioBase)).toBe(true);
    });

    it('impide iniciar sesión si el usuario está bloqueado', () => {
      const usuarioBloqueado: Usuario = { ...usuarioBase, estado: 'bloqueado' };
      expect(puedeIniciarSesion(usuarioBloqueado)).toBe(false);
    });
  });
});
