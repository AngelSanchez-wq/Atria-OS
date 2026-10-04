import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { NOMBRE_SISTEMA } from '../../config/sistema';
import { Buho } from '../components/Buho';
import { BarraProgreso } from '../components/BarraProgreso';

type PantallaEncendidoProps = {
  onTerminar: () => void;
};

const DURACION_SEGUNDOS = 3;
const PAUSA_SIN_MOVIMIENTO_MS = 400;

export function PantallaEncendido({ onTerminar }: PantallaEncendidoProps) {
  const reducirMovimiento = useReducedMotion();
  const [progreso, setProgreso] = useState(0);
  const valor = reducirMovimiento ? 100 : progreso;

  useEffect(() => {
    if (reducirMovimiento) {
      const temporizador = window.setTimeout(onTerminar, PAUSA_SIN_MOVIMIENTO_MS);
      return () => window.clearTimeout(temporizador);
    }

    const control = animate(0, 100, {
      duration: DURACION_SEGUNDOS,
      ease: 'easeInOut',
      onUpdate: (siguiente) => setProgreso(siguiente),
      onComplete: onTerminar,
    });

    return () => control.stop();
  }, [reducirMovimiento, onTerminar]);

  return (
    <main className="flex h-full w-full flex-col items-center justify-center bg-bg">
      <Buho estado="reposo" tamano={96} />
      <h1 className="mt-4 text-center font-display text-[32px] font-semibold text-ink">
        {NOMBRE_SISTEMA}
      </h1>
      <div className="mt-6">
        <BarraProgreso
          valor={valor}
          color="acento"
          etiqueta="Iniciando el sistema"
        />
      </div>
      <p className="mt-4 text-lg text-muted">Iniciando</p>
    </main>
  );
}
