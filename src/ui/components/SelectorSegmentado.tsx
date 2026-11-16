import { Check } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';

export type OpcionSegmentada<T extends string = string> = {
  valor?: T;
  id?: T;
  etiqueta: string;
  icono?: ReactNode;
  deshabilitada?: boolean;
  ariaLabel?: string;
};

type SelectorSegmentadoProps<T extends string = string> = {
  opciones: readonly OpcionSegmentada<T>[];
  valorSeleccionado?: T;
  valorActual?: T;
  onSeleccionar: (valor: T) => void;
  ariaLabel?: string;
  etiquetaAria?: string;
  disposicion?: 'horizontal' | 'vertical-icono';
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
  disposicion = 'horizontal',
  className = '',
}: SelectorSegmentadoProps<T>) {
  const activo = (valorSeleccionado ?? valorActual) as T;
  const etiquetaFinal = ariaLabel ?? etiquetaAria ?? 'Opciones';
  const habilitadas = opciones.filter((o) => !o.deshabilitada);

  const manejarTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    if (habilitadas.length === 0) return;
    const indiceActual = habilitadas.findIndex((o) => obtenerClave(o) === activo);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const siguiente = indiceActual === -1 ? 0 : (indiceActual + 1) % habilitadas.length;
      onSeleccionar(obtenerClave(habilitadas[siguiente]));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const anterior =
        indiceActual === -1
          ? habilitadas.length - 1
          : (indiceActual - 1 + habilitadas.length) % habilitadas.length;
      onSeleccionar(obtenerClave(habilitadas[anterior]));
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
        const seleccionado = clave === activo && !opcion.deshabilitada;
        const esVertical = disposicion === 'vertical-icono';

        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            aria-disabled={opcion.deshabilitada ? 'true' : undefined}
            aria-label={opcion.ariaLabel}
            tabIndex={seleccionado ? 0 : -1}
            onClick={() => {
              if (!opcion.deshabilitada) onSeleccionar(clave);
            }}
            className={[
              'flex flex-1 items-center justify-center rounded-xl text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none',
              esVertical ? 'flex-col gap-1 py-2 px-1 text-xs' : 'gap-1.5 py-2',
              opcion.deshabilitada
                ? 'opacity-45 cursor-not-allowed text-muted'
                : seleccionado
                  ? esVertical
                    ? 'bg-card text-accent-strong ring-2 ring-accent shadow-sm'
                    : 'bg-accent text-bg shadow-sm'
                  : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {opcion.icono ? (
              <span aria-hidden="true">{opcion.icono}</span>
            ) : seleccionado ? (
              <Check className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
            ) : null}
            <span>{opcion.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}
