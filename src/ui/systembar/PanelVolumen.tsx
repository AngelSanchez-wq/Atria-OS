import { useEffect, useRef } from 'react';
import { VolumeX, Volume2, Volume1 } from 'lucide-react';

export type PanelVolumenProps = {
  abierto: boolean;
  volumen: number;
  silenciado: boolean;
  onCerrar: () => void;
  onCambiarVolumen: (volumen: number) => void;
  onAlternarSilencio: () => void;
};

export function PanelVolumen({
  abierto,
  volumen,
  silenciado,
  onCerrar,
  onCambiarVolumen,
  onAlternarSilencio,
}: PanelVolumenProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const botonSilencioRef = useRef<HTMLButtonElement>(null);

  const porcentaje = Math.round(volumen * 100);

  useEffect(() => {
    if (!abierto) return;

    // Foco inicial en el botón de silencio al abrir
    const timer = setTimeout(() => {
      botonSilencioRef.current?.focus();
    }, 0);

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };

    const alClicFuera = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    window.addEventListener('mousedown', alClicFuera);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', alPulsarTecla);
      window.removeEventListener('mousedown', alClicFuera);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const IconoVolumen = silenciado
    ? VolumeX
    : volumen <= 0.5
    ? Volume1
    : Volume2;

  const manejarCambioSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = Number(e.target.value);
    onCambiarVolumen(valor / 100);
  };

  const manejarKeyDownSlider = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let paso = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      paso = 5;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      paso = -5;
    } else if (e.key === 'PageUp') {
      paso = 10;
    } else if (e.key === 'PageDown') {
      paso = -10;
    } else if (e.key === 'Home') {
      e.preventDefault();
      onCambiarVolumen(0);
      return;
    } else if (e.key === 'End') {
      e.preventDefault();
      onCambiarVolumen(1);
      return;
    }

    if (paso !== 0) {
      e.preventDefault();
      const nuevoPorcentaje = Math.max(0, Math.min(100, porcentaje + paso));
      onCambiarVolumen(nuevoPorcentaje / 100);
    }
  };

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Panel de volumen"
      className="absolute right-28 top-12 z-50 flex min-w-[280px] flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-xl select-none"
    >
      <h3 className="font-fredoka text-base font-semibold text-ink">
        Volumen
      </h3>

      {/* Fila interactiva: Botón silencio, slider y porcentaje */}
      <div className="flex items-center gap-3">
        <button
          ref={botonSilencioRef}
          type="button"
          aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
          aria-pressed={silenciado}
          onClick={onAlternarSilencio}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent outline-none"
        >
          <IconoVolumen size={20} aria-hidden="true" />
        </button>

        {/* Control deslizante accesible */}
        <div className="relative flex flex-1 items-center">
          {/* Pista de fondo y relleno visual */}
          <div className="h-2 w-full rounded-full bg-line overflow-hidden">
            <div
              className={`h-full transition-all motion-reduce:transition-none ${
                silenciado ? 'bg-muted/40' : 'bg-accent'
              }`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          <input
            type="range"
            role="slider"
            min={0}
            max={100}
            value={porcentaje}
            onChange={manejarCambioSlider}
            onKeyDown={manejarKeyDownSlider}
            aria-label="Volumen del sistema"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentaje}
            aria-valuetext={`${porcentaje} %`}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          />

          {/* Indicador (thumb) */}
          <div
            className={`pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 bg-card shadow-xs transition-colors ${
              silenciado ? 'border-muted' : 'border-accent'
            }`}
            style={{ left: `${porcentaje}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Valor en porcentaje */}
        <span className="min-w-[42px] text-right text-sm font-semibold text-ink">
          {porcentaje} %
        </span>
      </div>

      <p className="text-xs text-muted leading-tight">
        Controla todos los sonidos del sistema.
      </p>
    </div>
  );
}
