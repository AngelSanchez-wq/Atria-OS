import { Bell, Power, Volume2, Wifi } from 'lucide-react';
import {
  ALTURA_BARRA_CLASE,
  CLASE_CIRCULO_BUHO,
  NOTIFICACIONES_SIMULADAS,
  TAMANO_BUHO_BARRA,
  TAMANO_ICONO_BARRA,
} from '../../config/systembar';
import { useHora } from '../../hooks/useHora';
import { obtenerEstadoSistema } from '../../system/estado-sistema';
import { useSesion } from '../../store/sesion';
import { Buho } from '../components/Buho';
import { BotonIcono } from './BotonIcono';
import { IndicadorBateria } from './IndicadorBateria';

type BarraSistemaProps = {
  titulo?: string;
  notificaciones?: number;
  onVolver?: () => void;
  onWifi?: () => void;
  onVolumen?: () => void;
  onBateria?: () => void;
  onNotificaciones?: () => void;
  onUsuario?: () => void;
  onEncendido?: () => void;
};

export function BarraSistema({
  titulo,
  notificaciones = NOTIFICACIONES_SIMULADAS,
  onVolver,
  onWifi,
  onVolumen,
  onBateria,
  onNotificaciones,
  onUsuario,
  onEncendido,
}: BarraSistemaProps) {
  const { hora, fecha, ahora } = useHora();
  const estado = obtenerEstadoSistema();
  const usuario = useSesion((s) => s.usuario);
  const inicial = usuario?.inicial ?? '?';
  const nombreUsuario = usuario?.nombre ?? 'Usuario';

  return (
    <header
      role="banner"
      className={`flex ${ALTURA_BARRA_CLASE} w-full items-center gap-3 border-b border-line bg-card px-4`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={CLASE_CIRCULO_BUHO}>
          <Buho estado="foco" tamano={TAMANO_BUHO_BARRA} />
        </span>
        {onVolver ? (
          <button
            type="button"
            onClick={onVolver}
            className="text-sm font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            ← Escritorio
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        {titulo ? (
          <p className="truncate font-display text-base font-semibold text-ink">
            {titulo}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <time
          dateTime={ahora.toISOString()}
          className="flex flex-col items-end leading-tight text-muted"
        >
          <span className="text-sm font-semibold">{hora}</span>
          <span className="text-xs">{fecha}</span>
        </time>

        <BotonIcono
          etiqueta="Wi‑Fi"
          onClick={onWifi}
          className="text-muted"
        >
          <Wifi size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>

        <BotonIcono
          etiqueta="Volumen"
          onClick={onVolumen}
          className="text-muted"
        >
          <Volume2 size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>

        <IndicadorBateria
          porcentaje={estado.bateriaPorcentaje}
          onClick={onBateria}
        />

        <BotonIcono
          etiqueta={`Notificaciones, ${notificaciones}`}
          onClick={onNotificaciones}
          className="relative text-accent"
        >
          <Bell size={TAMANO_ICONO_BARRA} aria-hidden="true" />
          {notificaciones > 0 ? (
            <span
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-bg"
              aria-hidden="true"
            >
              {notificaciones}
            </span>
          ) : null}
        </BotonIcono>

        <BotonIcono
          etiqueta={nombreUsuario}
          onClick={onUsuario}
          className="text-ink"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-soft text-sm font-bold">
            {inicial}
          </span>
        </BotonIcono>

        <BotonIcono
          etiqueta="Apagar o reiniciar"
          onClick={onEncendido}
          className="text-muted"
        >
          <Power size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>
      </div>
    </header>
  );
}
