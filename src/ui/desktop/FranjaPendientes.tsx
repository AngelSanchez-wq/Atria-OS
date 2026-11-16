import { Plus } from 'lucide-react';
import { Tarea } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { IconoApp } from '../components/IconoApp';
import { PildoraEstado } from '../components/PildoraEstado';

type FranjaPendientesProps = {
  pendientes: Tarea[];
  maximo: number;
  onNuevaTarea?: () => void;
};

export function FranjaPendientes({
  pendientes,
  maximo,
  onNuevaTarea,
}: FranjaPendientesProps) {
  const activas = pendientes.length + 1; // 1 activa + pendientes
  const mostrar = pendientes.slice(0, 3); // Máximo 3 mostradas

  return (
    <div className="flex w-full flex-col items-center justify-center py-6 pb-12">
      <p className="mb-4 text-sm font-medium text-muted">
        Cupos {activas} de {maximo}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {mostrar.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-full border border-line bg-transparent px-4 py-2 opacity-80"
          >
            <IconoApp app={t.app} size={16} decorativo={true} />
            <span className="text-sm font-medium text-muted">
              {t.titulo} <span className="mx-1">&middot;</span> {APPS[t.app].nombre}
            </span>
            {t.importante && <PildoraEstado texto="Importante" />}
          </div>
        ))}

        {onNuevaTarea && (
          <button
            type="button"
            onClick={onNuevaTarea}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-transparent px-4 py-2 text-sm font-medium text-muted hover:bg-card hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nueva tarea</span>
          </button>
        )}
      </div>
    </div>
  );
}
