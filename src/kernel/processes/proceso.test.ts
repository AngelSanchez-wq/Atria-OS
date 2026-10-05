import { describe, it, expect } from 'vitest';
import { PCB } from '../types';
import {
  crearProceso,
  cambiarEstado,
  terminarProceso,
  memoriaEnUso,
  hayMemoriaDisponible,
  siguientePid,
} from './proceso';
import { MEMORIA_TOTAL_MB, CONFIG_PROCESO } from './constantes';

const TIMESTAMP_FIJO = 1_700_000_000_000; // Constante para tests deterministas
const USUARIO = 'mateo';

describe('siguientePid', () => {
  it('devuelve 1 si no hay procesos', () => {
    expect(siguientePid([])).toBe(1);
  });

  it('devuelve el PID máximo + 1', () => {
    const procesos = [
      { pid: 1 } as PCB,
      { pid: 5 } as PCB,
      { pid: 3 } as PCB,
    ];
    expect(siguientePid(procesos)).toBe(6);
  });
});

describe('memoriaEnUso', () => {
  it('suma solo los procesos no terminados', () => {
    const procesos: PCB[] = [
      { pid: 1, estado: 'En ejecución', memoriaMb: 256 } as PCB,
      { pid: 2, estado: 'Terminado',    memoriaMb: 192 } as PCB,
      { pid: 3, estado: 'Listo',        memoriaMb: 128 } as PCB,
    ];
    expect(memoriaEnUso(procesos)).toBe(384); // 256 + 128
  });
});

describe('hayMemoriaDisponible', () => {
  it('permite crear si hay espacio suficiente', () => {
    expect(hayMemoriaDisponible([], 'focuspad')).toBe(true);
  });

  it('bloquea si la memoria en uso + la nueva supera el límite', () => {
    // Llenamos casi todo con procesos ficticios
    const memoriaCasiLlena = MEMORIA_TOTAL_MB - CONFIG_PROCESO['focuspad'].memoriaMb + 1;
    const procesosGrandes: PCB[] = [
      { pid: 1, estado: 'En ejecución', memoriaMb: memoriaCasiLlena } as PCB,
    ];
    expect(hayMemoriaDisponible(procesosGrandes, 'focuspad')).toBe(false);
  });
});

describe('crearProceso', () => {
  it('crea un proceso con los datos correctos', () => {
    const resultado = crearProceso({
      appId: 'timelapse',
      usuarioId: USUARIO,
      tipoApp: 'web',
      url: 'https://pomofocus.io/',
      ahora: TIMESTAMP_FIJO,
      procesos: [],
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.proceso.nombre).toBe('timelapse');
    expect(resultado.proceso.estado).toBe('Nuevo');
    expect(resultado.proceso.pid).toBe(1);
    expect(resultado.proceso.creadoEn).toBe(TIMESTAMP_FIJO);
    expect(resultado.proceso.url).toBe('https://pomofocus.io/');
    expect(resultado.proceso.prioridad).toBe(CONFIG_PROCESO['timelapse'].prioridad);
    expect(resultado.proceso.memoriaMb).toBe(CONFIG_PROCESO['timelapse'].memoriaMb);
  });

  it('devuelve sin-memoria si no hay espacio', () => {
    const procesosGrandes: PCB[] = [
      { pid: 1, estado: 'En ejecución', memoriaMb: MEMORIA_TOTAL_MB } as PCB,
    ];
    const resultado = crearProceso({
      appId: 'focuspad',
      usuarioId: USUARIO,
      tipoApp: 'web',
      ahora: TIMESTAMP_FIJO,
      procesos: procesosGrandes,
    });

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.motivo).toBe('sin-memoria');
  });
});

describe('cambiarEstado', () => {
  it('devuelve una copia con el nuevo estado sin mutar el original', () => {
    const proceso: PCB = {
      pid: 1, nombre: 'focuspad', estado: 'Nuevo',
      prioridad: 8, memoriaMb: 256, usuarioId: USUARIO,
      creadoEn: TIMESTAMP_FIJO, tipoApp: 'web',
    };

    const actualizado = cambiarEstado(proceso, 'En ejecución');

    expect(actualizado.estado).toBe('En ejecución');
    expect(proceso.estado).toBe('Nuevo'); // no mutado
  });
});

describe('terminarProceso', () => {
  it('pone el estado en Terminado', () => {
    const proceso: PCB = {
      pid: 2, nombre: 'tagfs', estado: 'Listo',
      prioridad: 4, memoriaMb: 128, usuarioId: USUARIO,
      creadoEn: TIMESTAMP_FIJO, tipoApp: 'local',
    };

    const terminado = terminarProceso(proceso);
    expect(terminado.estado).toBe('Terminado');
    expect(proceso.estado).toBe('Listo'); // no mutado
  });
});
