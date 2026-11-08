import React, { useRef } from 'react';

export type OpcionSegmentada<T extends string = string> = {
  id: T;
  etiqueta: string;
};

export type SelectorSegmentadoProps<T extends string = string> = {
  opciones: OpcionSegmentada<T>[];
  valorActual: T;
  onSeleccionar: (id: T) => void;
  etiquetaAria: string;
  className?: string;
};

export function SelectorSegmentado<T extends string = string>({
  opciones,
  valorActual,
  onSeleccionar,
  etiquetaAria,
  className = '',
}: SelectorSegmentadoProps<T>) {
  const botonesRef = useRef<(HTMLButtonElement | null)[]>([]);

  const manejarKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    indiceActual: number
  ) => {
    let siguienteIndice = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      siguienteIndice = (indiceActual + 1) % opciones.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      siguienteIndice = (indiceActual - 1 + opciones.length) % opciones.length;
    }

    if (siguienteIndice !== -1) {
      const nuevaOpcion = opciones[siguienteIndice];
      onSeleccionar(nuevaOpcion.id);
      botonesRef.current[siguienteIndice]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={etiquetaAria}
      className={`flex items-center rounded-2xl border border-line bg-soft/50 p-1.5 select-none ${className}`}
    >
      {opciones.map((opcion, index) => {
        const seleccionada = valorActual === opcion.id;
        return (
          <button
            key={opcion.id}
            ref={(el) => {
              botonesRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onSeleccionar(opcion.id)}
            onKeyDown={(e) => manejarKeyDown(e, index)}
            className={`flex-1 rounded-xl py-2 px-4 text-center text-sm transition-all outline-none motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent ${
              seleccionada
                ? 'bg-accent font-bold text-bg shadow-xs'
                : 'font-semibold text-muted hover:text-ink'
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
