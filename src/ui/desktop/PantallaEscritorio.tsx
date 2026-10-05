import { useEffect, useState } from 'react';
import { useTareas } from '../../store/tareas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { BarraSistema } from '../systembar/BarraSistema';
import { Dock } from './Dock';
import { TarjetaTareaActiva } from './TarjetaTareaActiva';
import { FranjaPendientes } from './FranjaPendientes';
import { ContenedorVentanas } from '../window/ContenedorVentanas';
import { FACTOR_VELOCIDAD_DEMO } from '../../config/tiempo';
import { CUPO_MAXIMO_TAREAS } from '../../config/escritorio';

export function PantallaEscritorio() {
  const {
    tareaActiva,
    estado,
    segundosTranscurridos,
    pendientes,
    pausar,
    reanudar,
    terminar,
    avanzar,
  } = useTareas();

  const { ventanas, focusPid, abrir, restaurar, enfocar } = useVentanas();
  const { lanzar, cambiarEstado } = useProcesos();
  const usuario = useSesion((s) => s.usuario);

  const [avisoMemoria, setAvisoMemoria] = useState<string | null>(null);

  // Temporizador de progreso
  useEffect(() => {
    if (estado === 'pausada' || !tareaActiva) return;

    const intervalo = setInterval(() => {
      avanzar(FACTOR_VELOCIDAD_DEMO);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [estado, tareaActiva, avanzar]);

  const ventanaEnfocada = ventanas.find((v) => v.id === focusPid);
  const tituloBarra =
    ventanaEnfocada && ventanaEnfocada.estado !== 'minimizada'
      ? APPS[ventanaEnfocada.appId].nombre
      : undefined;

  const appEnfocadaId =
    ventanaEnfocada && ventanaEnfocada.estado !== 'minimizada'
      ? ventanaEnfocada.appId
      : null;

  const appsAbiertas = ventanas.map((v) => v.appId);

  const manejarAbrirApp = (idApp: AppId) => {
    setAvisoMemoria(null);
    const ventanaExistente = ventanas.find((v) => v.appId === idApp);

    if (ventanaExistente) {
      if (ventanaExistente.estado === 'minimizada') {
        restaurar(ventanaExistente.id);
        cambiarEstado(ventanaExistente.pid, 'En ejecución');
      } else {
        enfocar(ventanaExistente.id);
        cambiarEstado(ventanaExistente.pid, 'En ejecución');
      }
      return;
    }

    const usuarioId = usuario?.id ?? 'invitado';
    const proceso = lanzar(idApp, usuarioId);

    if (!proceso) {
      setAvisoMemoria(
        'No hay memoria disponible. Cierra una app para abrir otra.'
      );
      return;
    }

    abrir(idApp, proceso.pid);
    cambiarEstado(proceso.pid, 'En ejecución');
  };

  if (!tareaActiva) {
    return (
      <div className="flex h-full w-full flex-col bg-bg">
        <BarraSistema titulo={tituloBarra} />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-xl text-muted">
            Logro: pendiente (No tienes tareas pendientes)
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <BarraSistema titulo={tituloBarra} />

      {avisoMemoria && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center justify-between border-b border-warm-line bg-warm px-4 py-2 text-sm text-warm-ink"
        >
          <span>{avisoMemoria}</span>
          <button
            type="button"
            onClick={() => setAvisoMemoria(null)}
            className="font-bold underline outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Entendido
          </button>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <Dock
          appActiva={tareaActiva.app}
          appsAbiertas={appsAbiertas}
          appEnfocada={appEnfocadaId}
          onAbrirApp={manejarAbrirApp}
        />

        <main className="relative flex flex-1 flex-col items-center justify-between overflow-y-auto p-6">
          <div className="flex-1" />

          <div aria-live="polite" className="w-full max-w-2xl">
            <TarjetaTareaActiva
              tarea={tareaActiva}
              estado={estado}
              segundosTranscurridos={segundosTranscurridos}
              onPausar={pausar}
              onReanudar={reanudar}
              onTerminar={terminar}
            />
          </div>

          <div className="flex-[0.5]" />

          <FranjaPendientes
            pendientes={pendientes}
            maximo={CUPO_MAXIMO_TAREAS}
          />

          <ContenedorVentanas />
        </main>
      </div>
    </div>
  );
}
