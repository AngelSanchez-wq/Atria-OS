import { Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';

export type OpcionSegmentada<T extends string = string> = {
  valor?: T;
  id?: T;
  etiqueta: string;
};

type SelectorSegmentadoProps<T extends string = string> = {
  opciones: readonly OpcionSegmentada<T>[];
  valorSeleccionado?: T;
  valorActual?: T;
  onSeleccionar: (valor: T) => void;
  ariaLabel?: string;
  etiquetaAria?: string;
  className?: string;
};

function obtenerClave<T extends string>(opcion: OpcionSegmentada<T>): T {
  return (opcion.valor ?? opcion.id)!;
}

/**
 * Selector segmentado tipo pastilla accesible con soporte de WAI-ARIA radiogroup.
 */
export function SelectorSegmentado<T extends string = string>({
  opciones,
  valorSeleccionado,
  valorActual,
  onSeleccionar,
  ariaLabel,
  etiquetaAria,
  className = '',
}: SelectorSegmentadoProps<T>) {
  const activo = (valorSeleccionado ?? valorActual) as T;
  const etiquetaFinal = ariaLabel ?? etiquetaAria ?? 'Opciones';

  const manejarTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const indiceActual = opciones.findIndex((o) => obtenerClave(o) === activo);
    if (indiceActual === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const siguiente = (indiceActual + 1) % opciones.length;
      onSeleccionar(obtenerClave(opciones[siguiente]));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const anterior = (indiceActual - 1 + opciones.length) % opciones.length;
      onSeleccionar(obtenerClave(opciones[anterior]));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={etiquetaFinal}
      onKeyDown={manejarTeclado}
      className={[
        'flex w-full items-center rounded-2xl bg-soft/60 p-1 border border-line',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {opciones.map((opcion) => {
        const clave = obtenerClave(opcion);
        const seleccionado = clave === activo;
        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            tabIndex={seleccionado ? 0 : -1}
            onClick={() => onSeleccionar(clave)}
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
