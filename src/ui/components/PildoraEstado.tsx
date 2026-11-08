import { EstadoProceso, EstadoUsuario } from '../../kernel/types';
import { GravedadEvento } from '../../kernel/logs/types';

export type PildoraEstadoProps = {
  estado?: EstadoProceso | EstadoUsuario | 'Activo' | 'Bloqueado';
  gravedad?: GravedadEvento;
  texto?: string;
  conPunto?: boolean;
  className?: string;
};

const CLASES_POR_ESTADO: Record<string, string> = {
  'En ejecución': 'bg-soft text-accent-strong border border-accent/30',
  'Listo': 'bg-soft/70 text-accent-strong',
  'Bloqueado': 'bg-warm text-warm-ink border border-warm-line',
  'bloqueado': 'bg-warm text-warm-ink border border-warm-line',
  'Pausado': 'bg-line text-muted',
  'Nuevo': 'bg-line/50 text-muted',
  'Terminado': 'bg-line/30 text-muted line-through',
  'Activo': 'bg-soft text-accent-strong border border-accent/30',
  'activo': 'bg-soft text-accent-strong border border-accent/30',
};

export function PildoraEstado({
  estado,
  gravedad,
  texto,
  conPunto = false,
  className = '',
}: PildoraEstadoProps) {
  if (gravedad === 'aviso' || texto === 'Aviso') {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-warm text-warm-ink border border-warm-line select-none ${className}`}
      >
        {texto ?? 'Aviso'}
      </span>
    );
  }

  const clave = estado ?? texto ?? '';
  const clases = CLASES_POR_ESTADO[clave] || 'bg-line text-muted';
  const textoAMostrar = texto ?? (estado ? `${estado.charAt(0).toUpperCase()}${estado.slice(1)}` : '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold select-none ${clases} ${className}`}
    >
      {conPunto && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            clave.toLowerCase() === 'bloqueado' ? 'bg-warm-ink' : 'bg-accent-strong'
          }`}
          aria-hidden="true"
        />
      )}
      {textoAMostrar}
    </span>
  );
}
