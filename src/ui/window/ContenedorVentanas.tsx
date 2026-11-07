import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { useSesion } from '../../store/sesion';
import { APPS } from '../../config/apps';
import { AppId } from '../../kernel/types';
import { Ventana } from './Ventana';
import { IframeApp } from './IframeApp';
import { MarcadorApp } from './MarcadorApp';
import { MonitorProcesos } from '../monitor/MonitorProcesos';
import { Ambient } from '../../apps/ambient/Ambient';
import { servicioAudio } from '../../system/audio/servicio';

export function ContenedorVentanas() {
  const {
    ventanas,
    focusPid,
    cerrar,
    minimizar,
    maximizar,
    enfocar,
    mover,
  } = useVentanas();
  const { cambiarEstado, terminar } = useProcesos();
  const usuario = useSesion((s) => s.usuario);

  const manejarCerrar = (id: string, pid: number, appId: AppId) => {
    cerrar(id);
    terminar(pid);
    if (appId === 'ambient') {
      servicioAudio.detener();
    }
  };

  const manejarMinimizar = (id: string, pid: number) => {
    minimizar(id);
    cambiarEstado(pid, 'Listo');
  };

  const manejarEnfocar = (id: string, pid: number) => {
    enfocar(id);
    cambiarEstado(pid, 'En ejecución');
  };

  // Solo renderizar las ventanas que pertenecen al usuario en sesión actual
  const ventanasVisibles = ventanas.filter(
    (v) => !v.usuarioId || !usuario || v.usuarioId === usuario.id
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ventanasVisibles.map((ventana) => {
        const info = APPS[ventana.appId];
        const enfocada = focusPid === ventana.id;

        return (
          <div key={ventana.id} className="pointer-events-auto">
            <Ventana
              ventana={ventana}
              enfocada={enfocada}
              onEnfocar={() => manejarEnfocar(ventana.id, ventana.pid)}
              onMinimizar={() => manejarMinimizar(ventana.id, ventana.pid)}
              onMaximizar={() => maximizar(ventana.id)}
              onCerrar={() => manejarCerrar(ventana.id, ventana.pid, ventana.appId)}
              onMover={(x, y) => mover(ventana.id, x, y)}
            >
              {ventana.appId === 'monitor' ? (
                <MonitorProcesos />
              ) : ventana.appId === 'ambient' ? (
                <Ambient />
              ) : info.modo === 'ventana' && info.url ? (
                <IframeApp url={info.url} nombreApp={info.nombre} />
              ) : (
                <MarcadorApp appId={ventana.appId} />
              )}
            </Ventana>
          </div>
        );
      })}
    </div>
  );
}
