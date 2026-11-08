import { forwardRef } from 'react';

type BotonEnlaceProps = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export const BotonEnlace = forwardRef<HTMLButtonElement, BotonEnlaceProps>(
  function BotonEnlace({ onClick, children, className = '' }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`text-muted hover:text-ink underline decoration-line hover:decoration-muted underline-offset-4 transition-colors px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${className}`}
      >
        {children}
      </button>
    );
  }
);
