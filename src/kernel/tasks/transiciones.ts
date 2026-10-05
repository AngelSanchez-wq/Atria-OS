import { Tarea } from '../types';

export type ResultadoTransicion = {
  siguienteActiva: Tarea | null;
  nuevasPendientes: Tarea[];
};

export function terminarTarea(pendientes: Tarea[]): ResultadoTransicion {
  if (pendientes.length === 0) {
    return { siguienteActiva: null, nuevasPendientes: [] };
  }
  
  const [siguiente, ...resto] = pendientes;
  return { siguienteActiva: siguiente, nuevasPendientes: resto };
}
