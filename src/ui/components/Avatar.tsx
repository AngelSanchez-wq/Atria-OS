import { Check } from 'lucide-react';

type AvatarProps = {
  nombre: string;
  inicial: string;
  seleccionado: boolean;
  esAdmin?: boolean;
  onSeleccionar: () => void;
  /** Para el grupo de radios: solo el seleccionado queda en el tab order. */
  tabIndex?: number;
};

export function Avatar({
  nombre,
  inicial,
  seleccionado,
  esAdmin = false,
  onSeleccionar,
  tabIndex = 0,
}: AvatarProps) {
  const clasesCirculo = esAdmin
    ? seleccionado
      ? 'bg-warm text-warm-ink ring-4 ring-accent'
      : 'bg-warm text-warm-ink'
    : seleccionado
      ? 'bg-soft text-ink ring-4 ring-accent'
      : 'bg-line text-muted';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionado}
      aria-label={nombre}
      tabIndex={tabIndex}
      onClick={onSeleccionar}
      className="flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span className="relative inline-flex">
        <span
          className={[
            'flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold transition-shadow motion-reduce:transition-none',
            clasesCirculo,
          ].join(' ')}
        >
          {inicial}
        </span>
        {seleccionado ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg"
            aria-hidden="true"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span
        className={[
          'text-base',
          seleccionado ? 'font-bold text-ink' : 'font-normal text-muted',
        ].join(' ')}
      >
        {nombre}
      </span>
    </button>
  );
}
