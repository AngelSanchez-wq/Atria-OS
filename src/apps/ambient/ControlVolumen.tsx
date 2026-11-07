import { Volume1, Volume2 } from 'lucide-react';

type ControlVolumenProps = {
  volumen: number;
  onCambiarVolumen: (nuevoVolumen: number) => void;
};

export function ControlVolumen({
  volumen,
  onCambiarVolumen,
}: ControlVolumenProps) {
  return (
    <div className="flex w-full items-center gap-3 select-none">
      <Volume1 size={18} className="text-muted shrink-0" aria-hidden="true" />

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volumen}
        aria-label="Volumen"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volumen * 100)}
        aria-valuetext={`${Math.round(volumen * 100)}%`}
        onChange={(e) => onCambiarVolumen(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-soft accent-accent outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      <Volume2 size={18} className="text-muted shrink-0" aria-hidden="true" />
    </div>
  );
}
