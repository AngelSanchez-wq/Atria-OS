import { Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';

export type OpcionSegmentada<T extends string> = {
  valor: T;
  etiqueta: string;
};

type SelectorSegmentadoProps<T extends string> = {
  opciones: readonly OpcionSegmentada<T>[];
  valorSeleccionado: T;
  onSeleccionar: (valor: T) => void;
  ariaLabel?: string;
};

/**
 * Selector segmentado tipo pastilla accesible con soporte de WAI-ARIA radiogroup.
 */
export function SelectorSegmentado<T extends string>({
  opciones,
  valorSeleccionado,
  onSeleccionar,
  ariaLabel = 'Opciones',
}: SelectorSegmentadoProps<T>) {
  const manejarTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const indiceActual = opciones.findIndex((o) => o.valor === valorSeleccionado);
    if (indiceActual === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const siguiente = (indiceActual + 1) % opciones.length;
      onSeleccionar(opciones[siguiente].valor);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const anterior = (indiceActual - 1 + opciones.length) % opciones.length;
      onSeleccionar(opciones[anterior].valor);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={manejarTeclado}
      className="flex w-full items-center rounded-2xl bg-soft/60 p-1 border border-line"
    >
      {opciones.map((opcion) => {
        const seleccionado = opcion.valor === valorSeleccionado;
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            tabIndex={seleccionado ? 0 : -1}
            onClick={() => onSeleccionar(opcion.valor)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none',
              seleccionado
                ? 'bg-accent text-bg shadow-sm'
                : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {seleccionado ? (
              <Check className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
            ) : null}
            <span>{opcion.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}
