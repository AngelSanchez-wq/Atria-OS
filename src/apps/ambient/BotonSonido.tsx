import { InfoSonido } from './sonidos';

type BotonSonidoProps = {
  sonido: InfoSonido;
  activo: boolean;
  onClick: () => void;
};

export function BotonSonido({ sonido, activo, onClick }: BotonSonidoProps) {
  const Icono = sonido.icono;

  return (
    <button
      type="button"
      role="button"
      aria-pressed={activo}
      aria-label={`${sonido.nombre}${activo ? ', activo' : ''}`}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl p-6 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        activo
          ? 'border-2 border-accent bg-soft text-accent-strong shadow-xs'
          : 'border border-line bg-card text-muted hover:bg-soft/40 hover:text-ink'
      }`}
    >
      {activo && (
        <div
          aria-hidden="true"
          className="absolute right-3.5 top-3.5 flex h-3 items-end gap-0.5 text-accent-strong"
        >
          <span className="h-1.5 w-0.5 rounded-full bg-accent-strong motion-safe:animate-pulse" />
          <span className="h-3 w-0.5 rounded-full bg-accent-strong motion-safe:animate-pulse" />
          <span className="h-2 w-0.5 rounded-full bg-accent-strong motion-safe:animate-pulse" />
        </div>
      )}

      <Icono
        size={36}
        className={activo ? 'text-accent-strong' : 'text-muted'}
        aria-hidden="true"
      />

      <span
        className={`font-fredoka text-base font-semibold ${
          activo ? 'text-accent-strong' : 'text-muted'
        }`}
      >
        {sonido.nombre}
      </span>
    </button>
  );
}
