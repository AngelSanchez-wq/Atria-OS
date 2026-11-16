import { Tarea } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { IconoApp } from './IconoApp';
import { PildoraEstado } from './PildoraEstado';

type TarjetaTareaProps = {
  tarea: Tarea;
};

export function TarjetaTarea({ tarea }: TarjetaTareaProps) {
  const nombreApp = APPS[tarea.app].nombre;

  return (
    <article
      className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 w-full max-w-[420px]"
      aria-label={`Sugerencia: ${tarea.titulo}`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-soft text-accent">
        <IconoApp app={tarea.app} size={28} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-fredoka text-lg font-medium text-ink">
            {tarea.titulo}
          </h3>
          {tarea.importante && <PildoraEstado texto="Importante" className="shrink-0" />}
        </div>
        <p className="truncate text-sm text-muted">
          {nombreApp} &middot; {tarea.minutos} min &middot; #{tarea.etiqueta}
        </p>
      </div>
    </article>
  );
}
