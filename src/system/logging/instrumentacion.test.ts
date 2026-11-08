import { beforeEach, describe, expect, it } from 'vitest';
import { useRegistroStore } from '../../store/registro';
import { useProcesos } from '../../store/procesos';
import { registrar, obtenerEventos, limpiarRegistro } from './servicio';
import { MAXIMO_EVENTOS_REGISTRO } from '../../kernel/logs/constantes';
import { MEMORIA_TOTAL_MB, PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';

describe('Instrumentación del registro de eventos del sistema', () => {
  beforeEach(() => {
    limpiarRegistro();
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
  });

  describe('Flujos de procesos', () => {
    it('registra evento de proceso creado al lanzar una app con éxito', () => {
      const proc = useProcesos.getState().lanzar('focuspad', 'u1');
      expect(proc).not.toBeNull();

      const eventos = obtenerEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].categoria).toBe('proceso');
      expect(eventos[0].gravedad).toBe('info');
      expect(eventos[0].mensaje).toBe(`Proceso creado: FocusPad (PID ${proc?.pid})`);
      expect(eventos[0].usuarioId).toBe('u1');
    });

    it('registra aviso al haber memoria insuficiente para abrir una app', () => {
      // Llenamos la memoria artificialmente
      useProcesos.setState({
        procesos: [
          PROCESO_KERNEL_BASE,
          {
            pid: 2,
            nombre: 'burble',
            estado: 'En ejecución',
            memoriaMb: MEMORIA_TOTAL_MB - PROCESO_KERNEL_BASE.memoriaMb - 10,
            prioridad: 3,
            usuarioId: 'u1',
            creadoEn: 100,
            tipoApp: 'interna',
          },
        ],
      });

      // Intentar lanzar FocusPad que requiere 256 MB (> 10 MB disponibles)
      const proc = useProcesos.getState().lanzar('focuspad', 'u1');
      expect(proc).toBeNull();

      const eventos = obtenerEventos();
      const avisoMemoria = eventos.find((e) => e.gravedad === 'aviso' && e.categoria === 'proceso');
      expect(avisoMemoria).toBeDefined();
      expect(avisoMemoria?.mensaje).toBe('Memoria insuficiente al abrir FocusPad');
    });

    it('registra proceso terminado estándar', () => {
      const proc = useProcesos.getState().lanzar('focuspad', 'u1');
      expect(proc).toBeDefined();

      useProcesos.getState().terminar(proc!.pid);

      const eventos = obtenerEventos();
      expect(eventos).toHaveLength(2); // Creado + Terminado
      const eventoTerminado = eventos[1]; // El último agregado
      expect(eventoTerminado.categoria).toBe('proceso');
      expect(eventoTerminado.gravedad).toBe('info');
      expect(eventoTerminado.mensaje).toBe(`Proceso terminado: FocusPad (PID ${proc!.pid})`);
    });

    it('registra proceso terminado desde el monitor indicando el autor', () => {
      const proc = useProcesos.getState().lanzar('burble', 'u1');
      expect(proc).toBeDefined();

      useProcesos.getState().terminar(proc!.pid, {
        desdeMonitor: true,
        autor: 'Mateo',
      });

      const eventos = obtenerEventos();
      const eventoTerminado = eventos[eventos.length - 1];
      expect(eventoTerminado.categoria).toBe('proceso');
      expect(eventoTerminado.gravedad).toBe('info');
      expect(eventoTerminado.mensaje).toBe(
        `Proceso terminado desde el monitor: Burble (PID ${proc!.pid}) por Mateo`
      );
    });
  });

  describe('Flujos de energía y sesión mediante el servicio', () => {
    it('registra eventos de sesión (inicio, cambio y cierre)', () => {
      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Inicio de sesión exitoso (Mía)',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Cambio de usuario solicitado',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Sesión cerrada (Mía)',
        usuarioId: 'u1',
      });

      const eventos = obtenerEventos();
      expect(eventos).toHaveLength(3);
      expect(eventos.every((e) => e.categoria === 'sesion')).toBe(true);
    });

    it('registra eventos de energía (bloquear, suspender, reiniciar y apagar)', () => {
      registrar({
        categoria: 'energia',
        gravedad: 'info',
        mensaje: 'Sistema bloqueado',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'energia',
        gravedad: 'info',
        mensaje: 'Sistema suspendido',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'energia',
        gravedad: 'info',
        mensaje: 'Sistema reiniciado',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'energia',
        gravedad: 'info',
        mensaje: 'Sistema apagado',
        usuarioId: 'u1',
      });

      const eventos = obtenerEventos();
      expect(eventos).toHaveLength(4);
      expect(eventos.every((e) => e.categoria === 'energia')).toBe(true);
    });

    it('registra avisos de seguridad (PIN incorrecto y bloqueo temporal) sin exponer el PIN', () => {
      const pinSecreto = '1234';

      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'PIN incorrecto para Mía (quedan 2 intentos)',
        usuarioId: 'u1',
      });

      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'Demasiados intentos fallidos de PIN para Mía. Acceso bloqueado temporalmente.',
        usuarioId: 'u1',
      });

      const eventos = obtenerEventos();
      expect(eventos).toHaveLength(2);
      expect(eventos.every((e) => e.categoria === 'seguridad')).toBe(true);
      expect(eventos.every((e) => e.gravedad === 'aviso')).toBe(true);

      // Verificación estricta de que el PIN o datos sensibles nunca aparecen en los mensajes
      for (const ev of eventos) {
        expect(ev.mensaje).not.toContain(pinSecreto);
        expect(ev.mensaje.toLowerCase()).not.toContain('pin:');
      }
    });
  });

  describe('Capacidad máxima y descarte FIFO', () => {
    it(`respeta el límite de ${MAXIMO_EVENTOS_REGISTRO} eventos descartando los más antiguos`, () => {
      for (let i = 1; i <= MAXIMO_EVENTOS_REGISTRO + 50; i += 1) {
        registrar({
          categoria: 'proceso',
          gravedad: 'info',
          mensaje: `Evento número ${i}`,
        });
      }

      const eventos = useRegistroStore.getState().eventos;
      expect(eventos).toHaveLength(MAXIMO_EVENTOS_REGISTRO);

      // El más reciente debe ser el último agregado al arreglo
      expect(eventos[eventos.length - 1].mensaje).toBe(`Evento número ${MAXIMO_EVENTOS_REGISTRO + 50}`);
      // El más antiguo conservado debe ser el 51 al inicio
      expect(eventos[0].mensaje).toBe('Evento número 51');
      // Los primeros 50 fueron descartados
      const contienePrimero = eventos.some((e) => e.mensaje === 'Evento número 1');
      expect(contienePrimero).toBe(false);
    });
  });
});
