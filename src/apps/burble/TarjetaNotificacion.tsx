import { useEffect, useRef } from 'react';
import { Notificacion } from '../../kernel/types';
import { Boton } from '../../ui/components/Boton';
import { BotonEnlace } from '../../ui/components/BotonEnlace';
import {
  ICONOS_NOTIFICACION,
  ETIQUETAS_TIPO,
} from '../../ui/components/FilaNotificacion';
import { CLASE_TARJETA_RESPONSIVA } from '../../config/revision';

export type TarjetaNotificacionProps = {
  notificacion: Notificacion;
  onEntendido: () => void;
  onMasTarde: () => void;
  onVolver: () => void;
  className?: string;
};

function formatearHoraEpoch(timestamp: number): string {
  const d = new Date(timestamp);
  const horas = d.getHours().toString().padStart(2, '0');
  const minutos = d.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function TarjetaNotificacion({
  notificacion,
  onEntendido,
  onMasTarde,
  onVolver,
  className = '',
}: TarjetaNotificacionProps) {
  const botonEntendidoRef = useRef<HTMLButtonElement>(null);
  const esUrgente = notificacion.urgencia >= 5;
  const Icono = ICONOS_NOTIFICACION[notificacion.tipo];
  const etiquetaTipo = ETIQUETAS_TIPO[notificacion.tipo] ?? notificacion.tipo;
  const horaFormateada = formatearHoraEpoch(notificacion.creadaEn);

  // Foco automático en el botón principal al montar o cambiar de tarjeta
  useEffect(() => {
    botonEntendidoRef.current?.focus();
  }, [notificacion.id]);

  // Atajos de teclado: Enter para Entendido, M para Más tarde
  useEffect(() => {
    const manejarKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        onEntendido();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onMasTarde();
      }
    };

    window.addEventListener('keydown', manejarKeyDown);
    return () => {
      window.removeEventListener('keydown', manejarKeyDown);
    };
  }, [onEntendido, onMasTarde]);

  const bordeClases = esUrgente
    ? 'border-l-[6px] border-l-warm-line border-t border-r border-b border-line'
    : 'border border-line';

  return (
    <article
      role="article"
      aria-label={`Notificación ${etiquetaTipo}: ${notificacion.titulo}`}
      className={`flex flex-col justify-between rounded-2xl bg-card p-6 shadow-sm transition-all motion-reduce:transition-none ${bordeClases} ${CLASE_TARJETA_RESPONSIVA} ${className}`}
    >
      <div className="flex flex-col gap-3">
        {/* Cabecera de la tarjeta: Ícono, Etiqueta y Hora */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              esUrgente ? 'bg-warm text-warm-ink' : 'bg-soft text-accent-strong'
            }`}
            aria-hidden="true"
          >
            <Icono size={20} />
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              esUrgente ? 'bg-warm text-warm-ink' : 'bg-soft text-accent-strong'
            }`}
          >
            {esUrgente ? 'Urgente' : etiquetaTipo}
          </span>

          <span className="ml-auto text-xs font-semibold text-muted">
            {horaFormateada}
          </span>
        </div>

        {/* Título y detalle descriptivo */}
        <div className="flex flex-col gap-1.5 mt-1">
          <h3 className="text-[clamp(20px,3cqw,32px)] font-bold text-ink leading-snug">
            {notificacion.titulo}
          </h3>
          {notificacion.detalle && (
            <p className="text-[clamp(15px,2cqw,20px)] text-muted leading-relaxed">
              {notificacion.detalle}
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción y atajos */}
      <div className="mt-6 flex flex-col items-center gap-2.5">
        <div className="flex w-full items-center justify-center gap-3">
          <Boton
            ref={botonEntendidoRef}
            variante="principal"
            onClick={() => onEntendido()}
            className="min-w-[140px] min-h-[44px] h-[clamp(44px,6cqmin,52px)] px-6 text-base font-semibold shadow-xs"
          >
            Entendido
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => onMasTarde()}
            className="min-w-[140px] min-h-[44px] h-[clamp(44px,6cqmin,52px)] px-6 text-base font-semibold shadow-xs"
          >
            Más tarde
          </Boton>
        </div>

        <p className="text-xs text-muted/80 text-center select-none">
          Enter: Entendido · M: Más tarde
        </p>

        <BotonEnlace onClick={onVolver} className="mt-1 text-sm">
          Volver al resumen
        </BotonEnlace>
      </div>
    </article>
  );
}
