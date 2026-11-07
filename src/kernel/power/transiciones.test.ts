import { describe, it, expect } from 'vitest';
import {
  puedeTransicionar,
  transicionarEnergia,
  pausarProcesosPorSuspension,
  restaurarProcesosDeSuspension,
  limpiarProcesosPorReinicioOApagado,
} from './transiciones';
import { PCB } from '../types';
import { PID_KERNEL, PROCESO_KERNEL_BASE } from '../processes/constantes';

describe('Transiciones de energía', () => {
  it('valida transiciones legales correctamente', () => {
    expect(puedeTransicionar('encendiendo', 'login')).toBe(true);
    expect(puedeTransicionar('login', 'activo')).toBe(true);
    expect(puedeTransicionar('activo', 'bloqueado')).toBe(true);
    expect(puedeTransicionar('activo', 'suspendido')).toBe(true);
    expect(puedeTransicionar('activo', 'apagando')).toBe(true);
    expect(puedeTransicionar('activo', 'reiniciando')).toBe(true);
    expect(puedeTransicionar('suspendido', 'activo')).toBe(true);
    expect(puedeTransicionar('apagando', 'apagado')).toBe(true);
    expect(puedeTransicionar('reiniciando', 'encendiendo')).toBe(true);
    expect(puedeTransicionar('apagado', 'encendiendo')).toBe(true);
  });

  it('rechaza transiciones ilegales', () => {
    expect(puedeTransicionar('apagado', 'activo')).toBe(false);
    expect(puedeTransicionar('suspendido', 'bloqueado')).toBe(false);
    expect(puedeTransicionar('encendiendo', 'activo')).toBe(false);

    expect(() => transicionarEnergia('apagado', 'activo')).toThrowError(
      /Transición de energía inválida/
    );
  });

  it('pausa y restaura procesos de usuario sin afectar el kernel', () => {
    const procesos: PCB[] = [
      PROCESO_KERNEL_BASE,
      {
        pid: 2,
        nombre: 'timelapse',
        estado: 'En ejecución',
        prioridad: 7,
        memoriaMb: 192,
        usuarioId: 'mateo',
        creadoEn: 100,
        tipoApp: 'web',
      },
      {
        pid: 3,
        nombre: 'focuspad',
        estado: 'Listo',
        prioridad: 8,
        memoriaMb: 256,
        usuarioId: 'mateo',
        creadoEn: 200,
        tipoApp: 'web',
      },
    ];

    // 1. Pausar para suspensión
    const { procesosPausados, estadosPrevios } = pausarProcesosPorSuspension(procesos);

    expect(procesosPausados[0].estado).toBe('En ejecución'); // Kernel intacto
    expect(procesosPausados[1].estado).toBe('Pausado');
    expect(procesosPausados[2].estado).toBe('Pausado');

    expect(estadosPrevios[2]).toBe('En ejecución');
    expect(estadosPrevios[3]).toBe('Listo');

    // 2. Restaurar de suspensión
    const restaurados = restaurarProcesosDeSuspension(procesosPausados, estadosPrevios);
    expect(restaurados[0].estado).toBe('En ejecución');
    expect(restaurados[1].estado).toBe('En ejecución');
    expect(restaurados[2].estado).toBe('Listo');
  });

  it('limpia procesos dejando solo el kernel protegido', () => {
    const limpios = limpiarProcesosPorReinicioOApagado();
    expect(limpios).toHaveLength(1);
    expect(limpios[0].pid).toBe(PID_KERNEL);
  });
});
