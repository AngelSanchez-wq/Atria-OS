import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type BotonProps = {
  children: ReactNode;
  deshabilitado?: boolean;
  variante?: 'principal' | 'secundario';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'children'>;

const CLASES_VARIANTE: Record<NonNullable<BotonProps['variante']>, string> = {
  principal:
    'rounded-full bg-accent px-10 py-3 text-lg font-bold text-bg hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50',
  secundario:
    'rounded-full border-2 border-line px-10 py-3 text-lg font-bold text-muted hover:text-ink hover:border-muted bg-transparent disabled:cursor-not-allowed disabled:opacity-50',
};

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  {
    children,
    deshabilitado = false,
    variante = 'principal',
    type = 'button',
    className = '',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
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
});
