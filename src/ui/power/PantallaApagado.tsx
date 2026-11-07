import { Power } from 'lucide-react';
import { Boton } from '../components/Boton';

type PantallaApagadoProps = {
  onEncender: () => void;
};

export function PantallaApagado({ onEncender }: PantallaApagadoProps) {
  return (
    <div
      role="region"
      aria-label="Sistema apagado"
      className="flex h-full w-full flex-col items-center justify-center bg-ink p-6 select-none"
    >
      <div
        aria-live="polite"
        className="flex flex-col items-center gap-6"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card/5 text-card/30">
          <Power size={40} aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-fredoka text-xl font-semibold text-card/70">
            Atria-OS está apagado
          </h1>
        </div>

        <div className="mt-4">
          <Boton
            variante="principal"
            onClick={onEncender}
            className="flex items-center gap-2 !px-8"
          >
            <Power size={18} aria-hidden="true" />
            <span>Encender</span>
          </Boton>
        </div>
      </div>
    </div>
  );
}
