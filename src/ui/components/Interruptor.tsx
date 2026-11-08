import React from 'react';

export type InterruptorProps = {
  activo: boolean;
  onAlternar: () => void;
  etiqueta?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export function Interruptor({
  activo,
  onAlternar,
  etiqueta,
  id,
  disabled = false,
  className = '',
}: InterruptorProps) {
  const manejarKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) {
        onAlternar();
      }
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onAlternar();
        }
      }}
      onKeyDown={manejarKeyDown}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 outline-none motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 ${
        activo ? 'bg-accent' : 'bg-line'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-xs transition-transform duration-200 motion-reduce:transition-none ${
          activo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
