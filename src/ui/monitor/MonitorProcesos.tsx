import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { APPS } from '../../config/apps';
import { AppId, PCB } from '../../kernel/types';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import {
  esProcesoProtegido,
  obtenerProcesosActivos,
  calcularMetricasMemoria,
} from '../../kernel/processes/metricas';
import { BarraProgreso } from '../components/BarraProgreso';
import { IconoApp } from '../components/IconoApp';
import { PildoraEstado } from '../components/PildoraEstado';
import { Dialogo } from '../components/Dialogo';
import { TarjetaResumen } from './TarjetaResumen';

export function MonitorProcesos() {
  const { procesos, terminar } = useProcesos();
  const { ventanas, cerrar } = useVentanas();

  const [procesoATerminar, setProcesoATerminar] = useState<PCB | null>(null);
  const [mensajeLive, setMensajeLive] = useState<string>('');

  const procesosActivos = obtenerProcesosActivos(procesos);
  const metricas = calcularMetricasMemoria(procesos);

  const obtenerNombreProceso = (p: PCB): string => {
    if (esProcesoProtegido(p)) return p.nombre;
    const info = APPS[p.nombre as AppId];
    return info ? info.nombre : p.nombre;
  };

  const obtenerNombreUsuario = (usuarioId: string): string => {
    if (usuarioId === 'Sistema') return 'Sistema';
    const u = USUARIOS_SEMILLA.find((usr) => usr.id === usuarioId || usr.nombre.toLowerCase() === usuarioId.toLowerCase());
    return u ? u.nombre : usuarioId;
  };

  const confirmarTerminar = () => {
    if (!procesoATerminar) return;
    const nombre = obtenerNombreProceso(procesoATerminar);

    // 1. Terminar proceso en store del kernel
    terminar(procesoATerminar.pid);

    // 2. Cerrar ventana asociada si existe
    const ventanaAsociada = ventanas.find((v) => v.pid === procesoATerminar.pid);
    if (ventanaAsociada) {
      cerrar(ventanaAsociada.id);
    }

    setMensajeLive(`El proceso ${nombre} ha sido terminado.`);
    setProcesoATerminar(null);
  };

  const soloSistemaActivo = procesosActivos.length <= 1;

  return (
    <section
      role="region"
      aria-label="Monitor de procesos"
      className="flex h-full w-full flex-col justify-between overflow-y-auto bg-card p-6 select-none"
    >
      <div className="flex flex-col gap-6">
        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TarjetaResumen
            titulo="Procesos activos"
            valorPrincipal={procesosActivos.length}
          />

          <TarjetaResumen
            titulo={`Memoria en uso: ${metricas.memoriaEnUso} de ${metricas.totalMb} MB`}
            subtitulo={`${metricas.porcentaje} % de capacidad total`}
          >
            <BarraProgreso
              valor={metricas.porcentaje}
              color={metricas.colorBarra}
              etiqueta="Uso de memoria del sistema"
              className="h-2 w-full"
            />
          </TarjetaResumen>

          <TarjetaResumen
            titulo="Ventanas abiertas"
            valorPrincipal={ventanas.length}
          />
        </div>

        {/* Tabla de procesos */}
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full text-left text-sm text-ink">
            <thead className="border-b border-line bg-soft/40 text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">PID</th>
                <th scope="col" className="px-4 py-3 font-semibold">Proceso</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Prioridad</th>
                <th scope="col" className="px-4 py-3 font-semibold">Memoria</th>
                <th scope="col" className="px-4 py-3 font-semibold">Usuario</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {procesosActivos.map((p) => {
                const protegido = esProcesoProtegido(p);
                const nombre = obtenerNombreProceso(p);
                const usuario = obtenerNombreUsuario(p.usuarioId);

                return (
                  <tr key={p.pid} className="hover:bg-soft/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.pid}</td>
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center gap-2">
                        {protegido ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-soft text-accent">
                            <Shield size={14} aria-hidden="true" />
                          </div>
                        ) : (
                          <IconoApp app={p.nombre as AppId} size={18} decorativo={true} />
                        )}
                        <span>{nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PildoraEstado estado={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-muted">{p.prioridad}</td>
                    <td className="px-4 py-3 text-muted">{p.memoriaMb} MB</td>
                    <td className="px-4 py-3 text-muted">{usuario}</td>
                    <td className="px-4 py-3 text-right">
                      {protegido ? (
                        <span className="text-xs font-medium text-muted">
                          Protegido
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProcesoATerminar(p)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted hover:border-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
                        >
                          Terminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {soloSistemaActivo && (
            <div className="p-4 text-center text-xs text-muted">
              Solo está activo el sistema. Abre una app para ver su proceso.
            </div>
          )}
        </div>
      </div>

      {/* Pie con indicador y versión */}
      <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span>Se actualiza automáticamente</span>
        </div>
        <span>Atria-OS v2.4 Kernel Stable</span>
      </div>

      {/* Región para lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {mensajeLive}
      </div>

      {/* Diálogo accesible de confirmación */}
      <Dialogo
        abierto={procesoATerminar !== null}
        titulo={`¿Terminar ${procesoATerminar ? obtenerNombreProceso(procesoATerminar) : ''}?`}
        mensaje="Se cerrará su ventana y se liberará la memoria reservada."
        textoConfirmar="Terminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarTerminar}
        onCancelar={() => setProcesoATerminar(null)}
      />
    </section>
  );
}
