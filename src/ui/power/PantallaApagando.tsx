import { useEffect, useState } from 'react';
import { Buho } from '../components/Buho';
import { BarraProgreso } from '../components/BarraProgreso';
import {
  DURACION_APAGANDO_MS,
  DURACION_REINICIANDO_MS,
} from '../../config/energia';

type PantallaApagandoProps = {
  modo: 'apagando' | 'reiniciando';
  onTerminar: () => void;
};

export function PantallaApagando({ modo, onTerminar }: PantallaApagandoProps) {
  const [progreso, setProgreso] = useState(0);

  const esReinicio = modo === 'reiniciando';
  const titulo = esReinicio ? 'Reiniciando' : 'Guardando y apagando';

  useEffect(() => {
    const duracionTotal = esReinicio
      ? DURACION_REINICIANDO_MS
      : DURACION_APAGANDO_MS;
    const intervaloMs = 50;
    const incremento = 100 / (duracionTotal / intervaloMs);

    // Intervalo para animar la barra de progreso
    const intervalo = setInterval(() => {
      setProgreso((prev) => Math.min(prev + incremento, 100));
    }, intervaloMs);

    // Timeout independiente que llama a onTerminar al completar
    const timeout = setTimeout(() => {
      clearInterval(intervalo);
      onTerminar();
    }, duracionTotal);

    return () => {
      clearInterval(intervalo);
      clearTimeout(timeout);
    };
  }, [esReinicio, onTerminar]);

  return (
    <div
      role="region"
      aria-label={titulo}
      className="flex h-full w-full flex-col items-center justify-center bg-bg p-6 text-center select-none"
    >
      <div
        aria-live="polite"
        className="flex flex-col items-center gap-6"
      >
        <div className="opacity-80">
          <Buho estado="reposo" tamano={80} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-fredoka text-2xl font-semibold text-ink">
            {titulo}
          </h1>
          <p className="text-sm text-muted">
            Guardando el estado del sistema...
          </p>
        </div>

        <div className="mt-2 w-48">
          <BarraProgreso
            valor={progreso}
            color="acento"
            etiqueta={titulo}
            className="w-full h-1.5"
          />
        </div>
      </div>
    </div>
  );
}
