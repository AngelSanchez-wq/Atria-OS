import { Cog, MessageCircle, Clock, AlertTriangle, LucideIcon } from 'lucide-react';
import { TipoNotificacion, NivelUrgencia } from '../../kernel/types';

export const ICONOS_NOTIFICACION: Record<TipoNotificacion, LucideIcon> = {
  sistema: Cog,
  mensajes: MessageCircle,
  recordatorios: Clock,
  alertas: AlertTriangle,
};

export const ETIQUETAS_TIPO: Record<TipoNotificacion, string> = {
  sistema: 'Sistema',
  mensajes: 'Mensajes',
  recordatorios: 'Recordatorios',
  alertas: 'Alertas',
};

export type FilaNotificacionProps = {
  tipo: TipoNotificacion;
  cantidad: number;
  nivel: NivelUrgencia;
};

export function FilaNotificacion({ tipo, cantidad, nivel }: FilaNotificacionProps) {
  const Icono = ICONOS_NOTIFICACION[tipo] ?? AlertTriangle;
  const etiqueta = ETIQUETAS_TIPO[tipo] ?? tipo;

  const esUrgente = nivel === 'urgente';
  const clasesContenedor = esUrgente
    ? 'border-warm-line bg-warm text-warm-ink'
    : 'border-line bg-card text-ink';

  return (
    <div
      className={`flex w-full items-center justify-between rounded-xl border p-3 shadow-xs ${clasesContenedor}`}
      role="listitem"
      aria-label={`${cantidad} ${etiqueta.toLowerCase()}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <Icono size={20} aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold">{etiqueta}</span>
      </div>
      <span className="text-sm font-bold px-2 py-0.5 rounded-full" aria-hidden="true">
        {cantidad}
      </span>
    </div>
  );
}
