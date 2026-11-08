import { useState, useEffect } from 'react';
import {
  useNotificaciones,
  seleccionarEstadoRevision,
  seleccionarNotificacionActual,
  seleccionarSegmentosRevision,
  seleccionarProgresoRevision,
  seleccionarColaRevision,
} from '../../store/notificaciones';
import { agruparPorNivel } from '../../kernel/interrupts/reglas';
import { INTERVALO_REVISION_MS } from '../../config/notificaciones';
import { DURACION_LOGRO_MS } from '../../config/logro';
import {
  CLASE_CONTENEDOR_BURBLE,
  CLASE_ANILLO_LOGRO_RESPONSIVO,
} from '../../config/revision';
import { Buho } from '../../ui/components/Buho';
import { Boton } from '../../ui/components/Boton';
import { BotonEnlace } from '../../ui/components/BotonEnlace';
import { BarraProgreso } from '../../ui/components/BarraProgreso';
import { GrupoNotificaciones } from '../../ui/components/GrupoNotificaciones';
import { AnilloSegmentado } from '../../ui/components/AnilloSegmentado';
import { TarjetaNotificacion } from './TarjetaNotificacion';
import { useHora } from '../../hooks/useHora';

type VistaBurble = 'resumen' | 'revision';

function formatearHoraEpoch(timestamp: number): string {
  const d = new Date(timestamp);
  const horas = d.getHours().toString().padStart(2, '0');
  const minutos = d.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function Burble() {
  const store = useNotificaciones();
  const {
    notificaciones,
    proximaRevision,
    iniciarRevision,
    entendido,
    masTarde,
    seguirConPospuestas,
    cerrarRevision,
  } = store;

  const [vista, setVista] = useState<VistaBurble>('resumen');
  const { ahora } = useHora();

  // Selectores de estado derivados
  const estadoRevision = seleccionarEstadoRevision(store);
  const notificacionActual = seleccionarNotificacionActual(store);
  const segmentos = seleccionarSegmentosRevision(store);
  const progreso = seleccionarProgresoRevision(store);
  const cola = seleccionarColaRevision(store);

  // Notificaciones sin leer (retenidas + entregadas)
  const notificacionesPendientes = notificaciones.filter(
    (n) => n.estado !== 'leida'
  );

  // Cantidad de notificaciones que quedaron pospuestas
  const pospuestasCount = segmentos.filter((s) => s.estado === 'pospuesta').length;

  // Temporizador para el estado de logro (Lote revisado)
  useEffect(() => {
    if (vista !== 'revision' || estadoRevision !== 'terminada') return;

    const temporizador = setTimeout(() => {
      cerrarRevision();
      setVista('resumen');
    }, DURACION_LOGRO_MS);

    return () => {
      clearTimeout(temporizador);
    };
  }, [vista, estadoRevision, cerrarRevision]);

  const manejarRevisarAhora = () => {
    iniciarRevision();
    setVista('revision');
  };

  const manejarListo = () => {
    cerrarRevision();
    setVista('resumen');
  };

  const manejarVolver = () => {
    cerrarRevision();
    setVista('resumen');
  };

  // 1. VISTA DE REVISIÓN ACTIVA Y ESTADOS FINALES
  if (vista === 'revision') {
    // 1A. FIN CON LOGRO: Todo quedó leído
    if (estadoRevision === 'terminada') {
      return (
        <div
          role="status"
          aria-live="polite"
          className={`flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center select-none ${CLASE_CONTENEDOR_BURBLE}`}
        >
          {/* Anillo completo 20 % mayor con búho logro dentro (55 % diámetro) */}
          <AnilloSegmentado
            segmentos={segmentos}
            total={progreso.total}
            revisadas={progreso.total}
            pospuestas={0}
            className={CLASE_ANILLO_LOGRO_RESPONSIVO}
          >
            <Buho estado="logro" tamano={100} />
          </AnilloSegmentado>

          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold text-ink">
              Lote revisado
            </h2>
            <p className="text-sm text-muted font-medium">Todo al día.</p>
          </div>

          <Boton
            variante="principal"
            onClick={manejarListo}
            className="min-h-[44px] h-[clamp(44px,6cqmin,52px)] px-10 text-base font-bold shadow-xs"
          >
            Listo
          </Boton>
        </div>
      );
    }

    // 1B. FIN CON PENDIENTES: Quedan notificaciones pospuestas
    if (estadoRevision === 'terminada-con-pendientes') {
      return (
        <div
          role="status"
          aria-live="polite"
          className={`flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center select-none ${CLASE_CONTENEDOR_BURBLE}`}
        >
          {/* Anillo con segmentos punteados y contador final */}
          <AnilloSegmentado
            segmentos={segmentos}
            total={progreso.total}
            revisadas={progreso.revisadas}
            pospuestas={pospuestasCount}
          >
            <span className="font-display font-semibold text-[clamp(24px,6cqmin,48px)] text-ink leading-none">
              {progreso.revisadas}/{progreso.total}
            </span>
          </AnilloSegmentado>

          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold text-ink">
              Revisión terminada
            </h2>
            <p className="text-sm text-muted font-medium">
              Quedan {pospuestasCount}{' '}
              {pospuestasCount === 1 ? 'para más tarde.' : 'para más tarde.'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Boton
              variante="principal"
              onClick={() => seguirConPospuestas()}
              className="min-h-[44px] h-[clamp(44px,6cqmin,52px)] px-8 text-base font-bold shadow-xs"
            >
              Seguir con ellas
            </Boton>
            <BotonEnlace onClick={manejarVolver} className="mt-1 text-sm">
              Salir
            </BotonEnlace>
          </div>
        </div>
      );
    }

    // 1C. REVISIÓN EN CURSO: Una tarjeta por tarjeta con anillo segmentado
    if (notificacionActual) {
      const posicionActual =
        cola.findIndex((n) => n.id === notificacionActual.id) + 1;
      const totalCola = cola.length;

      return (
        <div
          role="region"
          aria-label="Revisión de notificaciones"
          aria-live="polite"
          className={`flex h-full w-full flex-col items-center justify-between overflow-y-auto p-6 ${CLASE_CONTENEDOR_BURBLE}`}
        >
          {/* Anillo segmentado superior con conteo actual/total */}
          <div className="my-auto flex flex-col items-center justify-center py-2">
            <AnilloSegmentado
              segmentos={segmentos}
              total={progreso.total}
              revisadas={progreso.revisadas}
              pospuestas={pospuestasCount}
            >
              <span className="font-display font-semibold text-[clamp(24px,6cqmin,48px)] text-ink leading-none">
                {posicionActual}/{totalCola}
              </span>
              <span className="text-[clamp(14px,2.5cqmin,18px)] text-muted font-medium mt-1">
                {progreso.revisadas} revisadas
              </span>
            </AnilloSegmentado>
          </div>

          {/* Tarjeta individual activa */}
          <div className="w-full flex justify-center mt-auto">
            <TarjetaNotificacion
              notificacion={notificacionActual}
              onEntendido={() => entendido()}
              onMasTarde={() => masTarde()}
              onVolver={manejarVolver}
            />
          </div>
        </div>
      );
    }
  }

  // 2. ESTADO VACÍO (cuando no hay notificaciones sin leer en el resumen)
  if (notificacionesPendientes.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center select-none ${CLASE_CONTENEDOR_BURBLE}`}
      >
        <Buho estado="reposo" tamano={80} />
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Todo al día.
          </h2>
          <p className="text-sm text-muted">
            No tienes notificaciones pendientes.
          </p>
        </div>
      </div>
    );
  }

  // 3. VISTA RESUMEN (Grupos de notificaciones por urgencia)
  const ahoraMs = ahora.getTime();
  const horaRevision = proximaRevision
    ? formatearHoraEpoch(proximaRevision)
    : formatearHoraEpoch(ahoraMs + INTERVALO_REVISION_MS);

  // Estimación de progreso hacia la próxima revisión
  const tiempoRestante = proximaRevision
    ? Math.max(0, proximaRevision - ahoraMs)
    : INTERVALO_REVISION_MS;
  const porcentajeRevision = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((INTERVALO_REVISION_MS - tiempoRestante) / INTERVALO_REVISION_MS) * 100
      )
    )
  );

  const grupos = agruparPorNivel(notificacionesPendientes);

  return (
    <div
      role="region"
      aria-label="Resumen de notificaciones de Burble"
      aria-live="polite"
      className={`flex h-full w-full flex-col justify-between overflow-y-auto p-6 ${CLASE_CONTENEDOR_BURBLE}`}
    >
      <div className="flex flex-col gap-5">
        {/* Cabecera: Próxima revisión y barra de progreso */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">
            Próxima revisión a las {horaRevision}
          </p>
          <BarraProgreso
            valor={porcentajeRevision}
            color="acento"
            etiqueta={`Progreso hacia la próxima revisión: ${porcentajeRevision}%`}
            className="h-1.5 w-full"
          />
        </div>

        {/* Grupos clasificados por nivel de urgencia */}
        <div className="flex flex-col gap-4">
          <GrupoNotificaciones
            titulo="URGENTE"
            nivel="urgente"
            notificaciones={grupos.urgente}
          />
          <GrupoNotificaciones
            titulo="NORMAL"
            nivel="normal"
            notificaciones={grupos.normal}
          />
          <GrupoNotificaciones
            titulo="BAJA"
            nivel="baja"
            notificaciones={grupos.baja}
          />
        </div>
      </div>

      {/* Pie: Botón revisar y nota explicativa */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Boton
          variante="principal"
          onClick={manejarRevisarAhora}
          deshabilitado={notificacionesPendientes.length === 0}
          className="w-auto px-10 py-2.5 text-base font-bold shadow-xs"
        >
          Revisar ahora
        </Boton>
        <p className="text-xs text-muted text-center max-w-xs">
          Las notificaciones normales y bajas esperan a la próxima revisión.
        </p>
      </div>
    </div>
  );
}
