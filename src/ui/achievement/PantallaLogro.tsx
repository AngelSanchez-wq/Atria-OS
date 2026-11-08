import { useEffect, useRef, useCallback } from 'react';
import { Tarea } from '../../kernel/types';
import { APPS } from '../../config/apps';
import {
  DURACION_LOGRO_MS,
  TITULO_LOGRO,
  TEXTO_CONTINUAR,
  TEXTO_SIGUIENTE,
} from '../../config/logro';
import { minutosEnfocados } from '../../kernel/tasks/tiempo';
import { Buho } from '../components/Buho';
import { BarraProgreso } from '../components/BarraProgreso';
import { BotonEnlace } from '../components/BotonEnlace';
import { IconoApp } from '../components/IconoApp';

type PantallaLogroProps = {
  tareaTerminada: Tarea;
  segundosTranscurridos: number;
  siguienteTarea?: Tarea | null;
  onContinuar: () => void;
};

export function PantallaLogro({
  tareaTerminada,
  segundosTranscurridos,
  siguienteTarea,
  onContinuar,
}: PantallaLogroProps) {
  const haContinuadoRef = useRef(false);
  const botonContinuarRef = useRef<HTMLButtonElement>(null);

  const manejarContinuar = useCallback(() => {
    if (haContinuadoRef.current) return;
    haContinuadoRef.current = true;
    onContinuar();
  }, [onContinuar]);

  useEffect(() => {
    // Foco inicial visible en el botón Continuar
    botonContinuarRef.current?.focus();

    // Temporizador de salida automática
    const temporizador = setTimeout(() => {
      manejarContinuar();
    }, DURACION_LOGRO_MS);

    return () => {
      clearTimeout(temporizador);
    };
  }, [manejarContinuar]);

  const minutos = minutosEnfocados(segundosTranscurridos);
  const infoAppSiguiente = siguienteTarea ? APPS[siguienteTarea.app] : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-full w-full flex-col items-center justify-between p-6 select-none"
    >
      <div className="flex-1" />

      {/* Contenido central del logro */}
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Buho estado="logro" tamano={128} />

        <div className="flex flex-col gap-1">
          <h2 className="font-fredoka text-3xl font-semibold text-ink">
            {TITULO_LOGRO}
          </h2>
          <p className="text-base text-muted font-medium">
            {tareaTerminada.titulo}
          </p>
        </div>

        {/* Etiqueta de minutos enfocados */}
        <div className="my-1">
          <span className="inline-flex items-center rounded-full bg-warm px-4 py-1 text-xs font-bold text-warm-ink shadow-xs">
            {minutos} min enfocada
          </span>
        </div>

        {/* Barra de progreso completa */}
        <div className="w-64 my-1">
          <BarraProgreso
            valor={100}
            color="calido"
            etiqueta="Tarea completada"
            className="h-1.5 w-full"
          />
        </div>

        {/* Enlace discreto para continuar inmediatamente */}
        <div className="mt-2">
          <BotonEnlace
            ref={botonContinuarRef}
            onClick={manejarContinuar}
            className="text-sm font-semibold"
          >
            {TEXTO_CONTINUAR}
          </BotonEnlace>
        </div>
      </div>

      <div className="flex-1" />

      {/* Franja inferior: Siguiente tarea pendiente (si existe) */}
      {siguienteTarea ? (
        <div className="mb-2 flex flex-col items-center gap-2 text-center">
          <span className="text-xs font-semibold text-muted tracking-wide">
            {TEXTO_SIGUIENTE}
          </span>
          <div className="flex items-center gap-2.5 rounded-full border border-line bg-card/80 px-4 py-2 text-xs font-semibold text-ink shadow-xs">
            <IconoApp app={siguienteTarea.app} size={16} decorativo={true} />
            <span>
              {siguienteTarea.titulo} · {infoAppSiguiente?.nombre ?? siguienteTarea.app} · {siguienteTarea.minutos} min
            </span>
          </div>
        </div>
      ) : (
        <div className="h-8" />
      )}
    </div>
  );
}
