import { Tarea } from '../types';

export type ResultadoTransicion = {
  siguienteActiva: Tarea | null;
  nuevasPendientes: Tarea[];
};

export function terminarTarea(pendientes: Tarea[]): ResultadoTransicion {
  const [siguienteActiva = null, ...nuevasPendientes] = pendientes;
  return { siguienteActiva, nuevasPendientes };
}

export type InfoTareaTerminada = {
  tarea: Tarea;
  segundosTranscurridos: number;
};

export type ResultadoIniciarLogro = {
  ultimaTerminada: InfoTareaTerminada;
  enLogro: true;
  tareaActiva: null;
};

export function iniciarLogro(
  tarea: Tarea,
  segundosTranscurridos: number
): ResultadoIniciarLogro {
  return {
    ultimaTerminada: { tarea, segundosTranscurridos },
    enLogro: true,
    tareaActiva: null,
  };
}

export type ResultadoContinuarLogro = ResultadoTransicion & {
  enLogro: false;
  ultimaTerminada: null;
  segundosTranscurridos: 0;
  estado: 'en-curso';
};

export function continuarLogro(pendientes: Tarea[]): ResultadoContinuarLogro {
  const { siguienteActiva, nuevasPendientes } = terminarTarea(pendientes);
  return {
    siguienteActiva,
    nuevasPendientes,
    enLogro: false,
    ultimaTerminada: null,
    segundosTranscurridos: 0,
    estado: 'en-curso',
  };
}
