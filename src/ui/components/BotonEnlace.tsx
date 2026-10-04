type BotonEnlaceProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export function BotonEnlace({ onClick, children }: BotonEnlaceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted hover:text-ink underline decoration-line hover:decoration-muted underline-offset-4 transition-colors px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
    >
      {children}
    </button>
  );
}
