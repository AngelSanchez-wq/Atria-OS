import { Check, Lock } from 'lucide-react';

type AvatarProps = {
  nombre: string;
  inicial: string;
  seleccionado?: boolean;
  esAdmin?: boolean;
  bloqueado?: boolean;
  imagen?: string;
  foto?: string;
  alt?: string;
  tamanoPx?: 40 | 80 | 96 | 120 | number;
  mostrarNombre?: boolean;
  onSeleccionar?: () => void;
  /** Para el grupo de radios: solo el seleccionado queda en el tab order. */
  tabIndex?: number;
};

export function Avatar({
  nombre,
  inicial,
  seleccionado = false,
  esAdmin = false,
  bloqueado = false,
  imagen,
  foto,
  alt,
  tamanoPx = 96,
  mostrarNombre = true,
  onSeleccionar,
  tabIndex = 0,
}: AvatarProps) {
  const urlFoto = foto ?? imagen;

  const clasesCirculo = esAdmin
    ? seleccionado
      ? 'bg-warm text-warm-ink ring-4 ring-accent'
      : 'bg-warm text-warm-ink'
    : seleccionado
      ? 'bg-soft text-ink ring-4 ring-accent'
      : 'bg-line text-muted';

  const clasesDimensiones = (() => {
    switch (tamanoPx) {
      case 40:
        return 'h-10 w-10 text-base';
      case 80:
        return 'h-20 w-20 text-3xl';
      case 120:
        return 'h-[120px] w-[120px] text-5xl';
      case 96:
      default:
        return 'h-24 w-24 text-4xl';
    }
  })();

  const contenido = (
    <>
      <span className="relative inline-flex">
        <span
          className={[
            'flex items-center justify-center rounded-full font-bold transition-all motion-reduce:transition-none overflow-hidden shrink-0',
            clasesDimensiones,
            clasesCirculo,
            bloqueado ? 'opacity-60' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {urlFoto ? (
            <img
              src={urlFoto}
              alt={alt ?? nombre}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            inicial
          )}
        </span>

        {bloqueado ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-warm text-warm-ink border border-warm-line shadow-xs"
            aria-hidden="true"
          >
            <Lock className="h-4 w-4 stroke-[2.5]" />
          </span>
        ) : seleccionado ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg"
            aria-hidden="true"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      {mostrarNombre && (
        <span
          className={[
            'text-base',
            seleccionado ? 'font-bold text-ink' : 'font-normal text-muted',
          ].join(' ')}
        >
          {nombre}
        </span>
      )}
    </>
  );

  if (onSeleccionar) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={seleccionado}
        aria-label={nombre}
        tabIndex={tabIndex}
        onClick={onSeleccionar}
        className={[
          'flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        ].join(' ')}
      >
        {contenido}
      </button>
    );
  }

  return <div className="flex flex-col items-center gap-2">{contenido}</div>;
}
