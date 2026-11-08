import { NivelUrgencia, Notificacion, TipoNotificacion } from '../../kernel/types';
import { contarPorTipo } from '../../kernel/interrupts/reglas';
import { FilaNotificacion } from './FilaNotificacion';

type GrupoNotificacionesProps = {
  titulo: string;
  nivel: NivelUrgencia;
  notificaciones: Notificacion[];
};

const ORDEN_TIPOS: TipoNotificacion[] = ['alertas', 'mensajes', 'recordatorios', 'sistema'];

export function GrupoNotificaciones({
  titulo,
  nivel,
  notificaciones,
}: GrupoNotificacionesProps) {
  if (notificaciones.length === 0) {
    return null;
  }

  const conteo = contarPorTipo(notificaciones);
  const tiposVisibles = ORDEN_TIPOS.filter((tipo) => conteo[tipo] > 0);

  if (tiposVisibles.length === 0) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label={`Notificaciones ${titulo.toLowerCase()}`}
      className="flex flex-col gap-2"
    >
      <h3 className="text-xs font-bold tracking-wider text-muted uppercase select-none">
        {titulo}
      </h3>
      <div className="flex flex-col gap-2" role="list">
        {tiposVisibles.map((tipo) => (
          <FilaNotificacion
            key={tipo}
            tipo={tipo}
            cantidad={conteo[tipo]}
            nivel={nivel}
          />
        ))}
      </div>
    </section>
  );
}
