import { useEffect, useState } from 'react';
import { useTareas } from '../../store/tareas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { useEnergia } from '../../store/energia';
import { useNotificaciones, seleccionarSinLeer } from '../../store/notificaciones';
import { useVolumenStore } from '../../store/volumen';
import { pausarProcesosPorSuspension } from '../../kernel/power/transiciones';
import { estadoBuho } from '../../kernel/tasks/buho';
import { PantallaLogro } from '../achievement/PantallaLogro';
import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { BarraSistema } from '../systembar/BarraSistema';
import { AvisoUrgente } from '../components/AvisoUrgente';
import { Dock } from './Dock';
import { TarjetaTareaActiva } from './TarjetaTareaActiva';
import { FranjaPendientes } from './FranjaPendientes';
import { ContenedorVentanas } from '../window/ContenedorVentanas';
import { FACTOR_VELOCIDAD_DEMO } from '../../config/tiempo';
import { CUPO_MAXIMO_TAREAS } from '../../config/escritorio';

type PantallaEscritorioProps = {
  onCambiarUsuario?: () => void;
  onCerrarSesion?: () => void;
};

export function PantallaEscritorio({
  onCambiarUsuario,
  onCerrarSesion,
}: PantallaEscritorioProps) {
  const {
    tareaActiva,
    estado,
    segundosTranscurridos,
    pendientes,
    ultimaTerminada,
    enLogro,
    pausar,
    reanudar,
    terminar,
    continuarTrasLogro,
    avanzar,
  } = useTareas();

  const { ventanas, focusPid, abrir, restaurar, enfocar } = useVentanas();
  const { procesos, lanzar, cambiarEstado } = useProcesos();
  const usuario = useSesion((s) => s.usuario);
  const {
    transicionar,
    solicitarApagar,
    solicitarReiniciar,
    guardarEstadosPrevios,
  } = useEnergia();

  const notificacionesSinLeer = useNotificaciones(seleccionarSinLeer);
  const avisoUrgente = useNotificaciones((s) => s.avisoUrgente);
  const descartarAvisoUrgente = useNotificaciones((s) => s.descartarAvisoUrgente);

  const volumen = useVolumenStore((s) => s.volumen);
  const silenciado = useVolumenStore((s) => s.silenciado);
  const setVolumen = useVolumenStore((s) => s.setVolumen);
  const alternarSilencio = useVolumenStore((s) => s.alternarSilencio);

  const [avisoMemoria, setAvisoMemoria] = useState<string | null>(null);

  // Temporizador de progreso
  useEffect(() => {
    if (estado === 'pausada' || !tareaActiva) return;

    const intervalo = setInterval(() => {
      avanzar(FACTOR_VELOCIDAD_DEMO);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [estado, tareaActiva, avanzar]);

  const ventanasUsuario = ventanas.filter(
    (v) => !v.usuarioId || !usuario || v.usuarioId === usuario.id
  );

  const ventanaEnfocada = ventanasUsuario.find((v) => v.id === focusPid);
  const tituloBarra =
    ventanaEnfocada && ventanaEnfocada.estado !== 'minimizada'
      ? APPS[ventanaEnfocada.appId].nombre
      : undefined;

  const appEnfocadaId =
    ventanaEnfocada && ventanaEnfocada.estado !== 'minimizada'
      ? ventanaEnfocada.appId
      : null;

  const appsAbiertas = ventanasUsuario.map((v) => v.appId);

  const manejarAbrirApp = (idApp: AppId) => {
    setAvisoMemoria(null);
    const usuarioId = usuario?.id ?? 'invitado';
    const ventanaExistente = ventanasUsuario.find((v) => v.appId === idApp);

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

    const proceso = lanzar(idApp, usuarioId);

    if (!proceso) {
      setAvisoMemoria(
        'No hay memoria disponible. Cierra una app para abrir otra.'
      );
      return;
    }

    abrir(idApp, proceso.pid, usuarioId);
    cambiarEstado(proceso.pid, 'En ejecución');
  };

  const manejarBloquear = () => {
    transicionar('bloqueado');
  };

  const manejarSuspender = () => {
    const { procesosPausados, estadosPrevios } = pausarProcesosPorSuspension(procesos);
    guardarEstadosPrevios(estadosPrevios);
    useProcesos.setState({ procesos: procesosPausados });
    transicionar('suspendido');
  };

  const estadoActualBuho = estadoBuho({
    tieneTareaActiva: !!tareaActiva,
    estadoTarea: estado,
    enLogro,
  });

  // Pantalla de logro al terminar una tarea
  if (enLogro && ultimaTerminada) {
    // TODO: Cuando existan suspensión y bloqueo, no interrumpir la pantalla de logro
    return (
      <div className="flex h-full w-full flex-col bg-bg">
        <BarraSistema
          titulo={tituloBarra}
          notificaciones={notificacionesSinLeer}
          onNotificaciones={() => manejarAbrirApp('burble')}
          estadoBuho="logro"
          volumen={volumen}
          silenciado={silenciado}
          onCambiarVolumen={setVolumen}
          onAlternarSilencio={alternarSilencio}
          onBloquear={manejarBloquear}
          onSuspender={manejarSuspender}
          onReiniciar={solicitarReiniciar}
          onApagar={solicitarApagar}
          onCambiarUsuario={onCambiarUsuario}
          onCerrarSesion={onCerrarSesion}
          onConfiguracion={() => manejarAbrirApp('configuracion')}
        />
        <AvisoUrgente
          aviso={avisoUrgente}
          onDescartar={descartarAvisoUrgente}
        />
        <div className="relative flex flex-1 overflow-hidden">
          <Dock
            appActiva={ultimaTerminada.tarea.app}
            appsAbiertas={appsAbiertas}
            appEnfocada={appEnfocadaId}
            onAbrirApp={manejarAbrirApp}
          />
          <main className="relative flex flex-1 flex-col overflow-y-auto">
            <PantallaLogro
              tareaTerminada={ultimaTerminada.tarea}
              segundosTranscurridos={ultimaTerminada.segundosTranscurridos}
              siguienteTarea={pendientes[0] ?? null}
              onContinuar={continuarTrasLogro}
            />
            <ContenedorVentanas />
          </main>
        </div>
      </div>
    );
  }

  // Estado vacío cuando no hay tareas activas
  if (!tareaActiva) {
    return (
      <div className="flex h-full w-full flex-col bg-bg">
        <BarraSistema
          titulo={tituloBarra}
          notificaciones={notificacionesSinLeer}
          onNotificaciones={() => manejarAbrirApp('burble')}
          estadoBuho={estadoActualBuho}
          volumen={volumen}
          silenciado={silenciado}
          onCambiarVolumen={setVolumen}
          onAlternarSilencio={alternarSilencio}
          onBloquear={manejarBloquear}
          onSuspender={manejarSuspender}
          onReiniciar={solicitarReiniciar}
          onApagar={solicitarApagar}
          onCambiarUsuario={onCambiarUsuario}
          onCerrarSesion={onCerrarSesion}
          onConfiguracion={() => manejarAbrirApp('configuracion')}
        />
        <AvisoUrgente
          aviso={avisoUrgente}
          onDescartar={descartarAvisoUrgente}
        />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-xl text-muted">
            No tienes tareas pendientes
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <BarraSistema
        titulo={tituloBarra}
        notificaciones={notificacionesSinLeer}
        onNotificaciones={() => manejarAbrirApp('burble')}
        estadoBuho={estadoActualBuho}
        volumen={volumen}
        silenciado={silenciado}
        onCambiarVolumen={setVolumen}
        onAlternarSilencio={alternarSilencio}
        onBloquear={manejarBloquear}
        onSuspender={manejarSuspender}
        onReiniciar={solicitarReiniciar}
        onApagar={solicitarApagar}
        onCambiarUsuario={onCambiarUsuario}
        onCerrarSesion={onCerrarSesion}
        onConfiguracion={() => manejarAbrirApp('configuracion')}
      />
      <AvisoUrgente
        aviso={avisoUrgente}
        onDescartar={descartarAvisoUrgente}
      />

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
