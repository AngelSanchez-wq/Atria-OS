import { describe, it, expect } from 'vitest';
import {
  pausarProcesosDeUsuario,
  restaurarProcesosDeUsuario,
  terminarProcesosDeUsuario,
} from './usuario-aislamiento';
import { PCB } from '../types';
import { PROCESO_KERNEL_BASE } from './constantes';

describe('usuario-aislamiento de procesos', () => {
  const pKernel = PROCESO_KERNEL_BASE;
  const pMateo1: PCB = {
    pid: 2,
    nombre: 'focuspad',
    estado: 'En ejecución',
    prioridad: 8,
    memoriaMb: 256,
    usuarioId: 'mateo',
    creadoEn: 100,
    tipoApp: 'web',
  };
  const pMateo2: PCB = {
    pid: 3,
    nombre: 'timelapse',
    estado: 'Listo',
    prioridad: 7,
    memoriaMb: 192,
    usuarioId: 'mateo',
    creadoEn: 200,
    tipoApp: 'web',
  };
  const pMia: PCB = {
    pid: 4,
    nombre: 'tagfs',
    estado: 'En ejecución',
    prioridad: 4,
    memoriaMb: 128,
    usuarioId: 'mia',
    creadoEn: 300,
    tipoApp: 'local',
  };

  const listaOriginal: PCB[] = [pKernel, pMateo1, pMateo2, pMia];

  it('pausa solo los procesos del usuario indicado y guarda sus estados previos', () => {
    const { procesosActualizados, estadosPrevios } = pausarProcesosDeUsuario(
      listaOriginal,
      'mateo'
    );

    expect(procesosActualizados[0].estado).toBe('En ejecución'); // Kernel intacto
    expect(procesosActualizados[1].estado).toBe('Pausado'); // Mateo 1 pausado
    expect(procesosActualizados[2].estado).toBe('Pausado'); // Mateo 2 pausado
    expect(procesosActualizados[3].estado).toBe('En ejecución'); // Mia intacta

    expect(estadosPrevios[2]).toBe('En ejecución');
    expect(estadosPrevios[3]).toBe('Listo');
  });

  it('restaura los procesos del usuario a su estado previo', () => {
    const { procesosActualizados, estadosPrevios } = pausarProcesosDeUsuario(
      listaOriginal,
      'mateo'
    );

    const restaurados = restaurarProcesosDeUsuario(
      procesosActualizados,
      'mateo',
      estadosPrevios
    );

    expect(restaurados[1].estado).toBe('En ejecución');
    expect(restaurados[2].estado).toBe('Listo');
  });

  it('termina los procesos de un usuario sin tocar los de otros usuarios ni el kernel', () => {
    const terminados = terminarProcesosDeUsuario(listaOriginal, 'mateo');

    expect(terminados[0].estado).toBe('En ejecución'); // Kernel
    expect(terminados[1].estado).toBe('Terminado'); // Mateo 1
    expect(terminados[2].estado).toBe('Terminado'); // Mateo 2
    expect(terminados[3].estado).toBe('En ejecución'); // Mia intacta
  });
});
