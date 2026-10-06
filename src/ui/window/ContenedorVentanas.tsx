import { useVentanas } from '../../store/ventanas';
import { useProcesos } from '../../store/procesos';
import { APPS } from '../../config/apps';
import { Ventana } from './Ventana';
import { IframeApp } from './IframeApp';
import { MarcadorApp } from './MarcadorApp';
import { MonitorProcesos } from '../monitor/MonitorProcesos';

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

  const manejarCerrar = (id: string, pid: number) => {
    cerrar(id);
    terminar(pid);
  };

  const manejarMinimizar = (id: string, pid: number) => {
    minimizar(id);
    cambiarEstado(pid, 'Listo');
  };

  const manejarEnfocar = (id: string, pid: number) => {
    enfocar(id);
    cambiarEstado(pid, 'En ejecución');
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ventanas.map((ventana) => {
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
              onCerrar={() => manejarCerrar(ventana.id, ventana.pid)}
              onMover={(x, y) => mover(ventana.id, x, y)}
            >
              {ventana.appId === 'monitor' ? (
                <MonitorProcesos />
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
