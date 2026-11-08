import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type BotonProps = {
  children: ReactNode;
  deshabilitado?: boolean;
  variante?: 'principal' | 'secundario';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'children'>;

const CLASES_BASE =
  'inline-flex items-center justify-center box-border min-h-[44px] px-8 rounded-full font-sans font-semibold text-base leading-none text-center select-none outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50';

const CLASES_VARIANTE: Record<NonNullable<BotonProps['variante']>, string> = {
  principal:
    'border-2 border-transparent bg-accent text-bg hover:bg-accent-strong',
  secundario:
    'border-2 border-line bg-transparent text-muted hover:text-ink hover:border-muted',
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
        CLASES_BASE,
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
