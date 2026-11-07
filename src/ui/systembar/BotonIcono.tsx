import { forwardRef, type ReactNode } from 'react';

type BotonIconoProps = {
  etiqueta: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export const BotonIcono = forwardRef<HTMLButtonElement, BotonIconoProps>(
  function BotonIcono({ etiqueta, children, onClick, className = '' }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={etiqueta}
        onClick={onClick}
        className={[
          'inline-flex items-center gap-1 rounded-md outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </button>
    );
  }
);
