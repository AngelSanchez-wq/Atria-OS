import { useEffect, useState } from 'react';
import { useTareas } from '../../store/tareas';
import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { useEnergia } from '../../store/energia';
import { useNotificaciones, seleccionarSinLeer } from '../../store/notificaciones';
import { pausarProcesosPorSuspension } from '../../kernel/power/transiciones';
import { estadoBuho } from '../../kernel/tasks/buho';
import { PantallaLogro } from '../achievement/PantallaLogro';
import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { BarraSistema } from '../systembar/BarraSistema';
import { AvisoUrgente } from '../components/AvisoUrgente';
import { registrar } from '../../system/logging/servicio';
import { puedeAbrirApp, cupoDeTareas } from '../../kernel/users/decisiones';
import { Dock } from './Dock';
import { TarjetaTareaActiva } from './TarjetaTareaActiva';
import { FranjaPendientes } from './FranjaPendientes';
import { ContenedorVentanas } from '../window/ContenedorVentanas';
import { DialogoRechazoApp } from './DialogoRechazoApp';
import { FACTOR_VELOCIDAD_DEMO } from '../../config/tiempo';

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

  const {
    ventanas,
    focusPid,
    abrir,
    restaurar,
    enfocar,
    ultimoRechazoApertura,
    registrarRechazoApertura,
  } = useVentanas();
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

    // Comprobación de límites por perfil en el kernel antes de abrir
    const decision = puedeAbrirApp(usuario, idApp, procesos);
    if (!decision.ok) {
      registrarRechazoApertura({ idApp, motivo: decision.motivo });
      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: `Apertura rechazada de ${APPS[idApp]?.nombre ?? idApp}: ${decision.motivo}`,
        usuarioId,
      });
      return;
    }

    const proceso = lanzar(idApp, usuarioId);

    if (!proceso) {
      registrarRechazoApertura({ idApp, motivo: 'memoria-insuficiente' });
      return;
    }

    abrir(idApp, proceso.pid, usuarioId);
    cambiarEstado(proceso.pid, 'En ejecución');
  };

  const manejarBloquear = () => {
    registrar({
      categoria: 'energia',
      gravedad: 'info',
      mensaje: 'Sistema bloqueado',
      usuarioId: usuario?.id,
    });
    transicionar('bloqueado');
  };

  const manejarSuspender = () => {
    registrar({
      categoria: 'energia',
      gravedad: 'info',
      mensaje: 'Sistema suspendido',
      usuarioId: usuario?.id,
    });
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
          onBloquear={manejarBloquear}
          onSuspender={manejarSuspender}
          onReiniciar={solicitarReiniciar}
          onApagar={solicitarApagar}
          onCambiarUsuario={onCambiarUsuario}
          onCerrarSesion={onCerrarSesion}
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
        <DialogoRechazoApp
          rechazo={ultimoRechazoApertura}
          onCerrar={() => registrarRechazoApertura(null)}
        />
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
          onBloquear={manejarBloquear}
          onSuspender={manejarSuspender}
          onReiniciar={solicitarReiniciar}
          onApagar={solicitarApagar}
          onCambiarUsuario={onCambiarUsuario}
          onCerrarSesion={onCerrarSesion}
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
        <DialogoRechazoApp
          rechazo={ultimoRechazoApertura}
          onCerrar={() => registrarRechazoApertura(null)}
        />
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
        onBloquear={manejarBloquear}
        onSuspender={manejarSuspender}
        onReiniciar={solicitarReiniciar}
        onApagar={solicitarApagar}
        onCambiarUsuario={onCambiarUsuario}
        onCerrarSesion={onCerrarSesion}
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
            maximo={cupoDeTareas(usuario)}
          />

          <ContenedorVentanas />
        </main>
      </div>

      <DialogoRechazoApp
        rechazo={ultimoRechazoApertura}
        onCerrar={() => registrarRechazoApertura(null)}
      />
    </div>
  );
}
