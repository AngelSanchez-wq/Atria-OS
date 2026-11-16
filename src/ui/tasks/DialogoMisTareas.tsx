import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { TareaGestionada, Usuario } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { MOTIVOS_ERROR_TAREAS } from '../../config/tareas';
import { MOTIVOS_RECHAZO_APP } from '../../kernel/users/constantes';
import { ordenarSugerencias } from '../../kernel/tasks/sugerencias';
import {
  useTareas,
  seleccionarTareasDeUsuario,
} from '../../store/tareas';
import { type DatosTarea, type ResultadoOperacionTarea } from '../../kernel/tasks/operaciones';
import { Boton } from '../components/Boton';
import { Dialogo } from '../components/Dialogo';
import { IconoApp } from '../components/IconoApp';
import { PildoraEstado } from '../components/PildoraEstado';
import { DialogoRechazoApp } from '../desktop/DialogoRechazoApp';
import { RechazoAperturaApp } from '../../store/ventanas';
import { DialogoTarea } from './DialogoTarea';

type DialogoMisTareasProps = {
  abierto: boolean;
  usuario: Usuario;
  onCerrar: () => void;
  onEmpezar?: (tarea: TareaGestionada) => void;
};

export function DialogoMisTareas({
  abierto,
  usuario,
  onCerrar,
  onEmpezar,
}: DialogoMisTareasProps) {
  if (!abierto) return null;
  return (
    <DialogoMisTareasModal
      key="dialogo-mis-tareas-activo"
      usuario={usuario}
      onCerrar={onCerrar}
      onEmpezar={onEmpezar}
    />
  );
}

function DialogoMisTareasModal({
  usuario,
  onCerrar,
  onEmpezar,
}: Omit<DialogoMisTareasProps, 'abierto'>) {
  const tareasPorUsuario = useTareas((s) => s.tareasPorUsuario);
  const crear = useTareas((s) => s.crear);
  const editar = useTareas((s) => s.editar);
  const eliminar = useTareas((s) => s.eliminar);
  const empezarTarea = useTareas((s) => s.empezarTarea);

  const [editando, setEditando] = useState<TareaGestionada | null>(null);
  const [creando, setCreando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<TareaGestionada | null>(null);
  const [rechazoApp, setRechazoApp] = useState<RechazoAperturaApp | null>(null);
  const [anuncio, setAnuncio] = useState('');

  const idTitulo = useId();
  const idExplicacionEnCurso = useId();
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    botonCerrarRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creando && !editando && !porEliminar && !rechazoApp) {
        e.preventDefault();
        onCerrarRef.current();
      }
    };
    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [creando, editando, porEliminar, rechazoApp]);

  const tareasVisibles = useMemo(() => {
    const todas = seleccionarTareasDeUsuario({ tareasPorUsuario }, usuario.id);
    const activas = todas.filter((t) => t.estado !== 'hecha');
    return ordenarSugerencias(activas);
  }, [tareasPorUsuario, usuario.id]);

  const manejarGuardar = (datos: DatosTarea, tareaId?: string): ResultadoOperacionTarea => {
    const res = tareaId ? editar(tareaId, datos) : crear(datos);
    if (res.ok) {
      setCreando(false);
      setEditando(null);
      setAnuncio('Tarea guardada');
    }
    return res;
  };

  const manejarConfirmarEliminar = () => {
    if (!porEliminar) return;
    const res = eliminar(porEliminar.id);
    setPorEliminar(null);
    if (res.ok) {
      setAnuncio('Tarea eliminada');
    }
  };

  const manejarAbrirTarea = (tarea: TareaGestionada) => {
    if (!usuario.limites.appsHabilitadas.includes(tarea.app)) {
      setRechazoApp({ idApp: tarea.app, motivo: MOTIVOS_RECHAZO_APP.APP_DESHABILITADA });
      return;
    }
    if (onEmpezar) {
      onEmpezar(tarea);
      onCerrarRef.current();
      return;
    }
    const res = empezarTarea(tarea.id);
    if (!res.ok && res.motivo === MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA) {
      setRechazoApp({ idApp: tarea.app, motivo: MOTIVOS_RECHAZO_APP.APP_DESHABILITADA });
    } else if (res.ok) {
      onCerrarRef.current();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 select-none"
        onClick={() => onCerrarRef.current()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-xl"
        >
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1.5 rounded-full bg-accent-strong" aria-hidden="true" />
              <h2 id={idTitulo} className="font-fredoka text-xl font-semibold text-ink">
                Mis tareas
              </h2>
            </div>
            <Boton
              variante="principal"
              onClick={() => setCreando(true)}
              className="!px-4 !py-2 text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Nueva tarea</span>
            </Boton>
          </header>

          {/* Región accesible para anunciar guardado/eliminado sin interrumpir */}
          <p className="sr-only" aria-live="polite">
            {anuncio}
          </p>

          <p id={idExplicacionEnCurso} className="sr-only">
            No puedes editar ni eliminar una tarea mientras está en curso.
          </p>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {tareasVisibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <p className="text-base text-muted">No tienes tareas pendientes.</p>
                <Boton
                  variante="principal"
                  onClick={() => setCreando(true)}
                  className="!px-5 !py-2 text-sm"
                >
                  Nueva tarea
                </Boton>
              </div>
            ) : (
              <ul className="space-y-3">
                {tareasVisibles.map((t) => {
                  const enUso = t.estado === 'en-curso' || t.estado === 'pausada';
                  const nombreApp = APPS[t.app]?.nombre ?? t.app;

                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-soft/40 px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => manejarAbrirTarea(t)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-accent">
                          <IconoApp app={t.app} size={22} decorativo={true} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-ink">
                              {t.titulo}
                            </span>
                            {t.importante && <PildoraEstado texto="Importante" />}
                            {enUso && <PildoraEstado texto="En curso" conPunto={true} />}
                          </div>
                          <p className="truncate text-xs text-muted">
                            {nombreApp} &middot; {t.minutos} min &middot; #{t.etiqueta}
                          </p>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${t.titulo}`}
                          aria-describedby={enUso ? idExplicacionEnCurso : undefined}
                          disabled={enUso}
                          onClick={() => setEditando(t)}
                          className="rounded-xl p-2 text-muted hover:bg-card hover:text-ink disabled:opacity-35 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${t.titulo}`}
                          aria-describedby={enUso ? idExplicacionEnCurso : undefined}
                          disabled={enUso}
                          onClick={() => setPorEliminar(t)}
                          className="rounded-xl p-2 text-muted hover:bg-card hover:text-ink disabled:opacity-35 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-line bg-card px-6 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Las tareas importantes se sugieren primero.</span>
            </p>
            <Boton
              ref={botonCerrarRef}
              variante="secundario"
              onClick={() => onCerrarRef.current()}
              className="!px-5 !py-2 text-sm shrink-0"
            >
              Cerrar
            </Boton>
          </footer>
        </div>
      </div>

      <DialogoTarea
        abierto={creando || editando !== null}
        usuario={usuario}
        tarea={editando}
        onGuardar={manejarGuardar}
        onCancelar={() => {
          setCreando(false);
          setEditando(null);
        }}
      />

      <Dialogo
        abierto={porEliminar !== null}
        titulo="¿Eliminar esta tarea?"
        mensaje={porEliminar ? `Se eliminará "${porEliminar.titulo}".` : ''}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={manejarConfirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />

      <DialogoRechazoApp
        rechazo={rechazoApp}
        onCerrar={() => setRechazoApp(null)}
      />
    </>
  );
}
