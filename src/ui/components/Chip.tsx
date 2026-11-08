import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ChipProps = {
  activo?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Chip({
  activo = false,
  children,
  className = '',
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={activo}
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold select-none outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent ${
        activo
          ? 'bg-accent text-bg font-bold shadow-2xs'
          : 'border border-line bg-card/60 text-muted hover:border-muted hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
