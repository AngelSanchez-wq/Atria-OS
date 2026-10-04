import type { ButtonHTMLAttributes, ReactNode } from 'react';

type BotonProps = {
  children: ReactNode;
  deshabilitado?: boolean;
  variante?: 'principal';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'children'>;

const CLASES_VARIANTE: Record<NonNullable<BotonProps['variante']>, string> = {
  principal:
    'rounded-full bg-accent px-10 py-3 text-lg font-bold text-bg hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50',
};

export function Boton({
  children,
  deshabilitado = false,
  variante = 'principal',
  type = 'button',
  className = '',
  ...rest
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={deshabilitado}
      className={[
        'outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        CLASES_VARIANTE[variante],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
