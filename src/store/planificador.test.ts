import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanificador } from './planificador';
import { useProcesos } from './procesos';
import { useRegistroStore } from './registro';
import { PROCESO_KERNEL_BASE, MEMORIA_TOTAL_MB } from '../kernel/processes/constantes';
import { PCB } from '../kernel/types';

describe('Store usePlanificador', () => {
  beforeEach(() => {
    usePlanificador.getState().restablecer();
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useRegistroStore.getState().limpiar();
  });

  it('inicia detenido en velocidad 1 y permite alternar estado y velocidad con auditoría', () => {
    const store = usePlanificador.getState();
    expect(store.activo).toBe(false);
    expect(store.velocidad).toBe(1);

    store.iniciar();
    expect(usePlanificador.getState().activo).toBe(true);

    store.cambiarVelocidad(5);
    expect(usePlanificador.getState().velocidad).toBe(5);

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.some((e) => e.mensaje.includes('Velocidad del planificador cambiada a ×5'))).toBe(true);

    store.detener();
    expect(usePlanificador.getState().activo).toBe(false);
  });

  it('agrega procesos de prueba con prioridades y memoria correctas marcados como esDemo', () => {
    const resultado = usePlanificador.getState().agregarProcesosDePrueba();
    expect(resultado.agregados).toBe(3);
    expect(resultado.rechazados).toBe(0);

    const procesos = useProcesos.getState().procesos;
    const demoA = procesos.find((p) => p.nombre === 'Demo A');
    const demoB = procesos.find((p) => p.nombre === 'Demo B');
    const demoC = procesos.find((p) => p.nombre === 'Demo C');

    expect(demoA).toBeDefined();
    expect(demoA?.prioridad).toBe(3);
    expect(demoA?.memoriaMb).toBe(20);
    expect(demoA?.esDemo).toBe(true);
    expect(demoA?.estado).toBe('Listo');

    expect(demoB?.prioridad).toBe(5);
    expect(demoB?.memoriaMb).toBe(20);
    expect(demoB?.esDemo).toBe(true);

    expect(demoC?.prioridad).toBe(9);
    expect(demoC?.memoriaMb).toBe(20);
    expect(demoC?.esDemo).toBe(true);

    // Registro de auditoría
    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.some((e) => e.mensaje.includes('Añadidos 3 procesos de prueba'))).toBe(true);
  });

  it('quitarProcesosDePrueba elimina únicamente los procesos marcados como demo', () => {
    // Añadimos un proceso normal de app
    const procesoNormal: PCB = {
      pid: 2,
      nombre: 'focuspad',
      estado: 'Listo',
      prioridad: 8,
      prioridadEfectiva: 8,
      ticksEsperando: 0,
      quantumRestante: 3,
      ticksEnCpu: 0,
      memoriaMb: 256,
      usuarioId: 'u1',
      creadoEn: 1000,
      tipoApp: 'interna',
    };
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, procesoNormal] });

    // Agregar procesos demo
    usePlanificador.getState().agregarProcesosDePrueba();
    expect(useProcesos.getState().procesos).toHaveLength(5); // Kernel + Normal + 3 Demos

    // Quitar procesos demo
    usePlanificador.getState().quitarProcesosDePrueba();
    const procesosRestantes = useProcesos.getState().procesos;
    expect(procesosRestantes).toHaveLength(2);
    expect(procesosRestantes.find((p) => p.nombre === 'focuspad')).toBeDefined();
    expect(procesosRestantes.find((p) => p.nombre === 'Demo A')).toBeUndefined();

    // Registro de auditoría
    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.some((e) => e.mensaje.includes('Eliminados 3 procesos de prueba'))).toBe(true);
  });

  it('respeta el límite de memoria total al intentar agregar procesos demo', () => {
    // Llenamos la memoria casi al tope
    const procesoPesado: PCB = {
      pid: 2,
      nombre: 'pesado',
      estado: 'Listo',
      prioridad: 5,
      prioridadEfectiva: 5,
      ticksEsperando: 0,
      quantumRestante: 3,
      ticksEnCpu: 0,
      memoriaMb: MEMORIA_TOTAL_MB - 10, // Solo quedan 10 MB disponibles (demos piden 20 MB)
      usuarioId: 'u1',
      creadoEn: 1000,
      tipoApp: 'interna',
    };
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, procesoPesado] });

    const resultado = usePlanificador.getState().agregarProcesosDePrueba();
    expect(resultado.agregados).toBe(0);
    expect(resultado.rechazados).toBe(3);
  });
});
