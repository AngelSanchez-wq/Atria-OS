import { useEffect } from 'react';
import { Moon } from 'lucide-react';

type PantallaSuspendidoProps = {
  onReanudar: () => void;
};

export function PantallaSuspendido({ onReanudar }: PantallaSuspendidoProps) {
  // TODO: Requerir PIN al volver de suspensión si se activa en ajustes

  useEffect(() => {
    const alPulsarCualquierTecla = () => {
      onReanudar();
    };

    window.addEventListener('keydown', alPulsarCualquierTecla);
    return () => window.removeEventListener('keydown', alPulsarCualquierTecla);
  }, [onReanudar]);

  return (
    <div
      role="region"
      aria-label="Sistema suspendido"
      onClick={onReanudar}
      className="flex h-full w-full cursor-pointer flex-col items-center justify-center bg-ink text-card select-none"
    >
      <div
        aria-live="polite"
        className="flex flex-col items-center gap-6 animate-pulse"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card/10 text-accent">
          <Moon size={36} aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-fredoka text-2xl font-semibold">
            Sistema suspendido
          </h1>
          <p className="text-sm text-card/70">
            Toca cualquier tecla o haz clic para continuar
          </p>
        </div>
      </div>
    </div>
  );
}
