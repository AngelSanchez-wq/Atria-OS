import { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { useSesion } from '../../store/sesion';
import { useRegistroStore } from '../../store/registro';
import { APPS } from '../../config/apps';
import { AppId, PCB } from '../../kernel/types';
import { CategoriaEvento } from '../../kernel/logs/types';
import {
  filtrarPorCategoria,
  ordenarDelMasRecienteAlMasAntiguo,
} from '../../kernel/logs/eventos';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import {
  esProcesoProtegido,
  obtenerProcesosActivos,
  calcularMetricasMemoria,
} from '../../kernel/processes/metricas';
import { BarraProgreso } from '../components/BarraProgreso';
import { IconoApp } from '../components/IconoApp';
import { PildoraEstado } from '../components/PildoraEstado';
import { Chip } from '../components/Chip';
import { Dialogo } from '../components/Dialogo';
import { TarjetaResumen } from './TarjetaResumen';
import { servicioAudio } from '../../system/audio/servicio';

export type TabMonitor = 'procesos' | 'registros';
export type FiltroRegistro = 'todo' | CategoriaEvento;

const OPCIONES_FILTRO: { id: FiltroRegistro; etiqueta: string }[] = [
  { id: 'todo', etiqueta: 'Todo' },
  { id: 'sesion', etiqueta: 'Sesiones' },
  { id: 'seguridad', etiqueta: 'Seguridad' },
  { id: 'proceso', etiqueta: 'Procesos' },
  { id: 'energia', etiqueta: 'Energía' },
];

function formatearHora(timestamp: number): string {
  const d = new Date(timestamp);
  const horas = d.getHours().toString().padStart(2, '0');
  const minutos = d.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function MonitorProcesos() {
  const usuario = useSesion((s) => s.usuario);
  const { procesos, terminar } = useProcesos();
  const { ventanas, cerrar } = useVentanas();
  const eventos = useRegistroStore((s) => s.eventos);
  const limpiar = useRegistroStore((s) => s.limpiar);

  const [tabActiva, setTabActiva] = useState<TabMonitor>('procesos');
  const [filtroActivo, setFiltroActivo] = useState<FiltroRegistro>('todo');
  const [procesoATerminar, setProcesoATerminar] = useState<PCB | null>(null);
  const [dialogoLimpiar, setDialogoLimpiar] = useState(false);
  const [mensajeLive, setMensajeLive] = useState<string>('');
  const [anuncioLive, setAnuncioLive] = useState<string>('');

  const cantidadAnteriorRef = useRef(eventos.length);
  const ultimoAnuncioEpochRef = useRef(0);

  // Anuncio para lectores de pantalla con límite de frecuencia (no saturar)
  useEffect(() => {
    if (eventos.length > cantidadAnteriorRef.current) {
      const ahora = Date.now();
      if (ahora - ultimoAnuncioEpochRef.current > 3000) {
        ultimoAnuncioEpochRef.current = ahora;
        setAnuncioLive('Nuevo evento en el registro');
      }
    }
    cantidadAnteriorRef.current = eventos.length;
  }, [eventos.length]);

  // Control de acceso: solo administradores
  const esAdmin = !usuario || usuario.rol === 'admin';
  if (!esAdmin) {
    return (
      <section
        role="region"
        aria-label="Acceso restringido"
        className="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-card"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-accent mb-4">
          <Shield size={24} aria-hidden="true" />
        </div>
        <h2 className="font-fredoka text-xl font-semibold text-ink">
          Acceso restringido
        </h2>
        <p className="mt-1 text-sm text-muted">
          Esta aplicación solo está disponible para administradores.
        </p>
      </section>
    );
  }

  const procesosActivos = obtenerProcesosActivos(procesos);
  const metricas = calcularMetricasMemoria(procesos);

  const obtenerNombreProceso = (p: PCB): string => {
    if (esProcesoProtegido(p)) return p.nombre;
    const info = APPS[p.nombre as AppId];
    return info ? info.nombre : p.nombre;
  };

  const obtenerNombreUsuario = (usuarioId: string): string => {
    if (usuarioId === 'Sistema') return 'Sistema';
    const u = USUARIOS_SEMILLA.find(
      (usr) =>
        usr.id === usuarioId ||
        usr.nombre.toLowerCase() === usuarioId.toLowerCase()
    );
    return u ? u.nombre : usuarioId;
  };

  const confirmarTerminar = () => {
    if (!procesoATerminar) return;
    const nombre = obtenerNombreProceso(procesoATerminar);
    const usuarioActual = useSesion.getState().usuario;
    const autor = usuarioActual?.nombre ?? 'Administrador';

    terminar(procesoATerminar.pid, { desdeMonitor: true, autor });

    const ventanaAsociada = ventanas.find((v) => v.pid === procesoATerminar.pid);
    if (ventanaAsociada) {
      cerrar(ventanaAsociada.id);
    }

    if (procesoATerminar.nombre === 'ambient') {
      servicioAudio.detener();
    }

    setMensajeLive(`El proceso ${nombre} ha sido terminado.`);
    setProcesoATerminar(null);
  };

  const manejarTecladoTabs = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    tab: TabMonitor
  ) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const siguienteTab: TabMonitor =
        tab === 'procesos' ? 'registros' : 'procesos';
      setTabActiva(siguienteTab);
      const siguienteBoton = document.getElementById(`tab-${siguienteTab}`);
      siguienteBoton?.focus();
    }
  };

  const eventosFiltrados =
    filtroActivo === 'todo'
      ? eventos
      : filtrarPorCategoria(eventos, filtroActivo);

  const eventosOrdenados = ordenarDelMasRecienteAlMasAntiguo(eventosFiltrados);
  const soloSistemaActivo = procesosActivos.length <= 1;

  return (
    <section
      role="region"
      aria-label="Monitor de procesos"
      className="flex h-full w-full flex-col justify-between overflow-y-auto bg-card select-none"
    >
      <div className="flex flex-col">
        {/* Cabecera de pestañas */}
        <div
          role="tablist"
          aria-label="Secciones del monitor de procesos"
          className="flex items-center gap-6 border-b border-line px-6 pt-4 shrink-0"
        >
          <button
            id="tab-procesos"
            type="button"
            role="tab"
            aria-selected={tabActiva === 'procesos'}
            aria-controls="panel-procesos"
            tabIndex={tabActiva === 'procesos' ? 0 : -1}
            onClick={() => setTabActiva('procesos')}
            onKeyDown={(e) => manejarTecladoTabs(e, 'procesos')}
            className={`pb-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tabActiva === 'procesos'
                ? 'border-b-2 border-accent text-ink font-bold'
                : 'border-b-2 border-transparent text-muted hover:text-ink font-semibold'
            }`}
          >
            Procesos
          </button>

          <button
            id="tab-registros"
            type="button"
            role="tab"
            aria-selected={tabActiva === 'registros'}
            aria-controls="panel-registros"
            tabIndex={tabActiva === 'registros' ? 0 : -1}
            onClick={() => setTabActiva('registros')}
            onKeyDown={(e) => manejarTecladoTabs(e, 'registros')}
            className={`pb-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tabActiva === 'registros'
                ? 'border-b-2 border-accent text-ink font-bold'
                : 'border-b-2 border-transparent text-muted hover:text-ink font-semibold'
            }`}
          >
            Registros
          </button>
        </div>

        {/* Panel de Procesos */}
        {tabActiva === 'procesos' && (
          <div
            id="panel-procesos"
            role="tabpanel"
            aria-labelledby="tab-procesos"
            tabIndex={0}
            className="flex flex-col gap-6 p-6 outline-none"
          >
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
                    const usr = obtenerNombreUsuario(p.usuarioId);

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
                        <td className="px-4 py-3 text-muted">{usr}</td>
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
        )}

        {/* Panel de Registros */}
        {tabActiva === 'registros' && (
          <div
            id="panel-registros"
            role="tabpanel"
            aria-labelledby="tab-registros"
            tabIndex={0}
            className="flex flex-col gap-4 p-6 outline-none"
          >
            {/* Chips de filtro */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {OPCIONES_FILTRO.map((opc) => (
                <Chip
                  key={opc.id}
                  activo={filtroActivo === opc.id}
                  onClick={() => setFiltroActivo(opc.id)}
                >
                  {opc.etiqueta}
                </Chip>
              ))}
            </div>

            {/* Tabla de eventos */}
            <div className="overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full text-left text-sm text-ink">
                <thead className="border-b border-line bg-soft/40 text-xs uppercase text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold w-24">HORA</th>
                    <th scope="col" className="px-4 py-3 font-semibold w-36">USUARIO</th>
                    <th scope="col" className="px-4 py-3 font-semibold">EVENTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {eventosOrdenados.map((ev) => {
                    const hora = formatearHora(ev.instante);
                    const usr = obtenerNombreUsuario(ev.usuarioId ?? 'Sistema');
                    const esAviso = ev.gravedad === 'aviso';

                    return (
                      <tr key={ev.id} className="hover:bg-soft/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                          {hora}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                          {usr}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <span>{ev.mensaje}</span>
                            {esAviso && <PildoraEstado gravedad="aviso" texto="Aviso" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {eventosOrdenados.length === 0 && (
                <div className="p-8 text-center text-sm text-muted">
                  Todavía no hay eventos.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pie según pestaña activa */}
      <div className="mx-6 mb-6 flex items-center justify-between border-t border-line/60 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span>Se actualiza automáticamente</span>
        </div>

        {tabActiva === 'registros' ? (
          <button
            type="button"
            onClick={() => setDialogoLimpiar(true)}
            className="rounded-full border border-line px-4 py-1.5 text-xs font-bold text-muted hover:border-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
          >
            Limpiar registro
          </button>
        ) : (
          <span>Atria-OS v2.4 Kernel Stable</span>
        )}
      </div>

      {/* Región accesible para lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {mensajeLive}
        {anuncioLive}
      </div>

      {/* Diálogo de confirmación para terminar proceso */}
      <Dialogo
        abierto={procesoATerminar !== null}
        titulo={`¿Terminar ${procesoATerminar ? obtenerNombreProceso(procesoATerminar) : ''}?`}
        mensaje="Se cerrará su ventana y se liberará la memoria reservada."
        textoConfirmar="Terminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarTerminar}
        onCancelar={() => setProcesoATerminar(null)}
      />

      {/* Diálogo de confirmación para limpiar el registro */}
      <Dialogo
        abierto={dialogoLimpiar}
        titulo="¿Limpiar el registro de eventos?"
        mensaje="Se eliminarán todos los eventos guardados en el sistema. Esta acción no se puede deshacer."
        textoConfirmar="Limpiar registro"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          limpiar();
          setDialogoLimpiar(false);
          setMensajeLive('El registro de eventos ha sido limpiado.');
        }}
        onCancelar={() => setDialogoLimpiar(false)}
      />
    </section>
  );
}
