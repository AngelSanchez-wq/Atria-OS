import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, Plus } from 'lucide-react';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { useSesion } from '../../store/sesion';
import { useRegistroStore } from '../../store/registro';
import { useUsuariosStore } from '../../store/usuarios';
import { APPS } from '../../config/apps';
import { AppId, PCB, Usuario, LimitesUsuario } from '../../kernel/types';
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
import { Boton } from '../components/Boton';
import { Dialogo } from '../components/Dialogo';
import { TarjetaResumen } from './TarjetaResumen';
import { DialogoNuevoUsuario } from './DialogoNuevoUsuario';
import { PanelEditarLimites } from './PanelEditarLimites';
import { PanelPlanificador } from './PanelPlanificador';
import { servicioAudio } from '../../system/audio/servicio';
import { DatosCrearUsuario } from '../../kernel/users/operaciones';

export type TabMonitor = 'usuarios' | 'procesos' | 'planificador' | 'registros';
export type FiltroRegistro = 'todo' | CategoriaEvento;

const TABS: TabMonitor[] = ['usuarios', 'procesos', 'planificador', 'registros'];

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

function formatearUltimoAcceso(timestamp: number | null): string {
  if (!timestamp) return 'Nunca';
  const fecha = new Date(timestamp);
  const ahora = new Date();

  const esHoy =
    fecha.getDate() === ahora.getDate() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getFullYear() === ahora.getFullYear();

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  const esAyer =
    fecha.getDate() === ayer.getDate() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getFullYear() === ayer.getFullYear();

  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');

  if (esHoy) return `Hoy ${horas}:${minutos}`;
  if (esAyer) return `Ayer ${horas}:${minutos}`;

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  return `${dia}/${mes} ${horas}:${minutos}`;
}

export function MonitorProcesos() {
  const usuarioActual = useSesion((s) => s.usuario);
  const { procesos, terminar } = useProcesos();
  const { ventanas, cerrar } = useVentanas();
  const eventos = useRegistroStore((s) => s.eventos);
  const limpiar = useRegistroStore((s) => s.limpiar);

  // Store de usuarios
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const crearUsuarioStore = useUsuariosStore((s) => s.crearUsuario);
  const bloquearUsuarioStore = useUsuariosStore((s) => s.bloquearUsuario);
  const desbloquearUsuarioStore = useUsuariosStore((s) => s.desbloquearUsuario);
  const actualizarLimitesStore = useUsuariosStore((s) => s.actualizarLimites);

  const [tabActiva, setTabActiva] = useState<TabMonitor>('usuarios');
  const [filtroActivo, setFiltroActivo] = useState<FiltroRegistro>('todo');
  const [procesoATerminar, setProcesoATerminar] = useState<PCB | null>(null);
  const [dialogoLimpiar, setDialogoLimpiar] = useState(false);
  const [dialogoNuevoUsuario, setDialogoNuevoUsuario] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [mensajeErrorAccion, setMensajeErrorAccion] = useState<string | null>(null);
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

  const actor = usuarioActual ?? usuarios.find((u) => u.rol === 'admin') ?? USUARIOS_SEMILLA[2];

  const cerrarDialogoNuevoUsuario = useCallback(() => {
    setDialogoNuevoUsuario(false);
  }, []);

  const cerrarProcesoATerminar = useCallback(() => {
    setProcesoATerminar(null);
  }, []);

  const cerrarDialogoLimpiar = useCallback(() => {
    setDialogoLimpiar(false);
  }, []);

  const manejarCrearUsuario = useCallback((datos: DatosCrearUsuario) => {
    const res = crearUsuarioStore(actor, datos);
    if (res.ok) {
      setMensajeLive(`Usuario ${res.usuario.nombre} creado correctamente.`);
    }
    return res;
  }, [actor, crearUsuarioStore]);

  // Control de acceso: solo administradores
  const esAdmin = !usuarioActual || usuarioActual.rol === 'admin';
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
    const u = usuarios.find(
      (usr) =>
        usr.id === usuarioId ||
        usr.nombre.toLowerCase() === usuarioId.toLowerCase()
    );
    return u ? u.nombre : usuarioId;
  };

  const confirmarTerminar = () => {
    if (!procesoATerminar) return;
    const nombre = obtenerNombreProceso(procesoATerminar);
    const autor = actor?.nombre ?? 'Administrador';

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
      const indiceActual = TABS.indexOf(tab);
      const siguienteIndice =
        e.key === 'ArrowRight'
          ? (indiceActual + 1) % TABS.length
          : (indiceActual - 1 + TABS.length) % TABS.length;
      const siguienteTab = TABS[siguienteIndice];
      setTabActiva(siguienteTab);
      const siguienteBoton = document.getElementById(`tab-${siguienteTab}`);
      siguienteBoton?.focus();
    }
  };

  const esUnicoAdminActivo = (u: Usuario) => {
    if (u.rol !== 'admin' || u.estado !== 'activo') return false;
    const adminsActivos = usuarios.filter(
      (x) => x.rol === 'admin' && x.estado === 'activo'
    );
    return adminsActivos.length <= 1;
  };

  const manejarBloquearDesbloquear = (u: Usuario) => {
    setMensajeErrorAccion(null);
    if (u.estado === 'activo') {
      const res = bloquearUsuarioStore(actor, u.id);
      if (!res.ok) {
        setMensajeErrorAccion(
          res.motivo === 'ultimo-admin-activo'
            ? 'No se puede bloquear al único administrador activo.'
            : res.motivo === 'auto-bloqueo-no-permitido'
            ? 'No puedes bloquear tu propia cuenta.'
            : 'No se pudo bloquear al usuario.'
        );
      } else {
        setMensajeLive(`El usuario ${u.nombre} ha sido bloqueado.`);
      }
    } else {
      const res = desbloquearUsuarioStore(actor, u.id);
      if (!res.ok) {
        setMensajeErrorAccion('No se pudo desbloquear al usuario.');
      } else {
        setMensajeLive(`El usuario ${u.nombre} ha sido desbloqueado.`);
      }
    }
  };

  const manejarGuardarLimites = (
    usuarioId: string,
    nuevosLimites: Partial<LimitesUsuario>
  ) => {
    const res = actualizarLimitesStore(actor, usuarioId, nuevosLimites);
    if (res.ok) {
      setMensajeLive(`Límites actualizados para ${res.usuario.nombre}.`);
    }
    return res;
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
      aria-label="Administración"
      className="relative flex h-full w-full flex-col justify-between overflow-y-auto bg-card select-none [container-type:inline-size]"
    >
      <div className="flex flex-col">
        {/* Cabecera de pestañas accesibles */}
        <div className="flex items-center justify-between border-b border-line px-6 pt-4 shrink-0">
          <div
            role="tablist"
            aria-label="Secciones de administración"
            className="flex items-center gap-6"
          >
            <button
              id="tab-usuarios"
              type="button"
              role="tab"
              aria-selected={tabActiva === 'usuarios'}
              aria-controls="panel-usuarios"
              tabIndex={tabActiva === 'usuarios' ? 0 : -1}
              onClick={() => setTabActiva('usuarios')}
              onKeyDown={(e) => manejarTecladoTabs(e, 'usuarios')}
              className={`flex items-center gap-2 pb-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                tabActiva === 'usuarios'
                  ? 'border-b-2 border-accent text-ink font-bold'
                  : 'border-b-2 border-transparent text-muted hover:text-ink font-semibold'
              }`}
            >
              <span>Usuarios</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-soft px-1.5 text-xs font-bold text-accent-strong">
                {usuarios.length}
              </span>
            </button>

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
              id="tab-planificador"
              type="button"
              role="tab"
              aria-selected={tabActiva === 'planificador'}
              aria-controls="panel-planificador"
              tabIndex={tabActiva === 'planificador' ? 0 : -1}
              onClick={() => setTabActiva('planificador')}
              onKeyDown={(e) => manejarTecladoTabs(e, 'planificador')}
              className={`pb-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                tabActiva === 'planificador'
                  ? 'border-b-2 border-accent text-ink font-bold'
                  : 'border-b-2 border-transparent text-muted hover:text-ink font-semibold'
              }`}
            >
              Planificador
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

          {tabActiva === 'usuarios' && (
            <div className="pb-2">
              <Boton
                variante="principal"
                onClick={() => setDialogoNuevoUsuario(true)}
                className="!px-4 !py-1.5 text-xs font-semibold gap-1.5"
              >
                <Plus size={15} aria-hidden="true" />
                <span>Nuevo usuario</span>
              </Boton>
            </div>
          )}
        </div>

        {/* Mensaje de error de acción tranquilo si ocurre */}
        {mensajeErrorAccion && (
          <div
            role="alert"
            className="mx-6 mt-3 flex items-center justify-between rounded-xl border border-warm-line bg-warm/80 px-4 py-2 text-xs font-semibold text-warm-ink"
          >
            <span>{mensajeErrorAccion}</span>
            <button
              type="button"
              onClick={() => setMensajeErrorAccion(null)}
              className="underline hover:text-ink outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Panel de Usuarios */}
        {tabActiva === 'usuarios' && (
          <div
            id="panel-usuarios"
            role="tabpanel"
            aria-labelledby="tab-usuarios"
            tabIndex={0}
            className="flex flex-col gap-6 p-6 outline-none"
          >
            {/* Tabla de Usuarios */}
            <div className="w-full overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-line bg-soft/30">
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      USUARIO
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      ROL
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      ESTADO
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      ÚLTIMO ACCESO
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {usuarios.map((u) => {
                    const unicoAdmin = esUnicoAdminActivo(u);
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-soft/20">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-soft text-sm font-bold text-accent-strong shrink-0"
                              aria-hidden="true"
                            >
                              {u.inicial}
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-ink">
                              <span>{u.nombre}</span>
                              {u.rol === 'admin' && (
                                <Shield size={14} className="text-accent shrink-0" aria-label="Administrador" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted">
                          {u.rol === 'admin' ? 'Administrador' : 'Estándar'}
                        </td>
                        <td className="px-4 py-3.5">
                          <PildoraEstado
                            estado={u.estado === 'activo' ? 'Activo' : 'Bloqueado'}
                            conPunto
                          />
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted">
                          {formatearUltimoAcceso(u.ultimoAcceso)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => setUsuarioAEditar(u)}
                              className="text-sm font-semibold text-ink hover:text-accent-strong transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xs"
                            >
                              Editar
                            </button>
                            <span className="text-line" aria-hidden="true">
                              |
                            </span>
                            {unicoAdmin ? (
                              <span className="text-xs text-muted/70">
                                Único administrador
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => manejarBloquearDesbloquear(u)}
                                className="text-sm font-semibold text-ink hover:text-accent-strong transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xs"
                              >
                                {u.estado === 'activo' ? 'Bloquear' : 'Desbloquear'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Banner de Políticas de Seguridad (como en Mockup 1) */}
            <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-soft/40 px-4 py-3 border border-line/60 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent shrink-0" aria-hidden="true" />
                <span>
                  Políticas de seguridad: Autenticación en dos fases requerida para roles de administración.
                </span>
              </div>
              <button
                type="button"
                className="text-accent-strong hover:underline font-semibold shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xs"
              >
                Configurar directivas
              </button>
            </div>
          </div>
        )}

        {/* Panel de Procesos (funcionalidad existente intacta) */}
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
                titulo="Memoria en uso"
                valorPrincipal={`${metricas.memoriaEnUso} MB`}
                subtitulo={`de ${metricas.totalMb} MB (${metricas.porcentaje} %)`}
              >
                <div className="mt-3">
                  <BarraProgreso
                    valor={metricas.porcentaje}
                    color={metricas.colorBarra}
                    etiqueta="Memoria usada"
                  />
                </div>
              </TarjetaResumen>

              <TarjetaResumen
                titulo="Procesos activos"
                valorPrincipal={procesosActivos.length}
                subtitulo="En ejecución o listos"
              />

              <TarjetaResumen
                titulo="Proceso base"
                valorPrincipal="Kernel"
                subtitulo="Protegido del sistema"
              />
            </div>

            {/* Tabla de Procesos */}
            <div className="w-full overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-line bg-soft/30">
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      APLICACIÓN
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      PID
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      ESTADO
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      PRIORIDAD
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      MEMORIA
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      USUARIO
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">
                      ACCIÓN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {procesosActivos.map((p) => {
                    const protegido = esProcesoProtegido(p);
                    const nombreVisible = obtenerNombreProceso(p);
                    const nombreUsuario = obtenerNombreUsuario(p.usuarioId);

                    return (
                      <tr key={p.pid} className="transition-colors hover:bg-soft/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft p-1">
                              {protegido ? (
                                <Shield size={18} className="text-accent" />
                              ) : (
                                <IconoApp app={p.nombre as AppId} size={20} />
                              )}
                            </span>
                            <span className="font-semibold text-ink">{nombreVisible}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{p.pid}</td>
                        <td className="px-4 py-3">
                          <PildoraEstado estado={p.estado} />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-ink">
                          {p.prioridadEfectiva ?? p.prioridad}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-ink">
                          {p.memoriaMb} MB
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {nombreUsuario}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {protegido ? (
                            <span className="text-xs font-semibold text-muted">
                              Protegido
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setProcesoATerminar(p)}
                              className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink transition-colors hover:border-accent hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent outline-none"
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
                <div className="p-8 text-center text-sm text-muted">
                  No hay aplicaciones de usuario abiertas. Solo el kernel está activo.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel del Planificador */}
        {tabActiva === 'planificador' && <PanelPlanificador />}

        {/* Panel de Registros (funcionalidad existente intacta) */}
        {tabActiva === 'registros' && (
          <div
            id="panel-registros"
            role="tabpanel"
            aria-labelledby="tab-registros"
            tabIndex={0}
            className="flex flex-col gap-6 p-6 outline-none"
          >
            {/* Chips de Filtro */}
            <div className="flex flex-wrap items-center gap-2">
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

            {/* Tabla de Eventos */}
            <div className="w-full overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-line bg-soft/30">
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      HORA
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      USUARIO
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                      EVENTO
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {eventosOrdenados.map((ev) => (
                    <tr key={ev.id} className="transition-colors hover:bg-soft/20">
                      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                        {formatearHora(ev.instante)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">
                        {ev.usuarioId ? obtenerNombreUsuario(ev.usuarioId) : 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink">
                        <div className="flex items-center gap-2">
                          {ev.gravedad === 'aviso' && (
                            <PildoraEstado gravedad="aviso" texto="Aviso" />
                          )}
                          <span>{ev.mensaje}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {/* Diálogo de nuevo usuario */}
      <DialogoNuevoUsuario
        abierto={dialogoNuevoUsuario}
        onCrear={manejarCrearUsuario}
        onCancelar={cerrarDialogoNuevoUsuario}
      />

      {/* Panel lateral de edición de límites */}
      <PanelEditarLimites
        usuario={usuarioAEditar}
        onGuardar={manejarGuardarLimites}
        onCerrar={() => setUsuarioAEditar(null)}
      />

      {/* Diálogo de confirmación para terminar proceso */}
      <Dialogo
        abierto={procesoATerminar !== null}
        titulo={`¿Terminar ${procesoATerminar ? obtenerNombreProceso(procesoATerminar) : ''}?`}
        mensaje="Se cerrará su ventana y se liberará la memoria reservada."
        textoConfirmar="Terminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarTerminar}
        onCancelar={cerrarProcesoATerminar}
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
          cerrarDialogoLimpiar();
          setMensajeLive('El registro de eventos ha sido limpiado.');
        }}
        onCancelar={cerrarDialogoLimpiar}
      />
    </section>
  );
}
