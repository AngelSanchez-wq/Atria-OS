import type { KeyboardEvent } from 'react';

type InterruptorProps = {
  activo: boolean;
  onAlternar: (nuevoEstado: boolean) => void;
  ariaLabel?: string;
  etiqueta?: string;
  deshabilitado?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Componente de interruptor accesible (switch) siguiendo las guías WAI-ARIA.
 * Estilizado completamente con los tokens de diseño de Atria-OS (sin hex ni inline styles).
 */
export function Interruptor({
  activo,
  onAlternar,
  ariaLabel,
  etiqueta,
  deshabilitado = false,
  disabled = false,
  id,
  className = '',
}: InterruptorProps) {
  const estaDeshabilitado = deshabilitado || disabled;
  const textoAccesible = ariaLabel ?? etiqueta;

  const manejarClick = () => {
    if (estaDeshabilitado) return;
    onAlternar(!activo);
  };

  const manejarTeclado = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (estaDeshabilitado) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onAlternar(!activo);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={textoAccesible}
      disabled={estaDeshabilitado}
      onClick={manejarClick}
      onKeyDown={manejarTeclado}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none',
        estaDeshabilitado ? 'cursor-not-allowed opacity-50' : '',
        activo ? 'bg-accent' : 'bg-line',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform duration-200 ease-in-out motion-reduce:transition-none',
          activo ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}
