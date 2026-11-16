import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Info, Lock, X } from 'lucide-react';
import { AppId, TareaGestionada, Usuario } from '../../kernel/types';
import { APPS } from '../../config/apps';
import {
  DURACIONES_PERMITIDAS,
  LONGITUD_MAX_ETIQUETA,
  LONGITUD_MAX_TITULO,
  MOTIVOS_ERROR_TAREAS,
  TEXTOS_MOTIVOS_TAREAS,
} from '../../config/tareas';
import { validarTarea, type DatosTarea, type ResultadoOperacionTarea } from '../../kernel/tasks/operaciones';
import { Boton } from '../components/Boton';
import { IconoApp } from '../components/IconoApp';
import { Interruptor } from '../components/Interruptor';
import { SelectorSegmentado, type OpcionSegmentada } from '../components/SelectorSegmentado';

const APPS_TAREAS: readonly AppId[] = ['focuspad', 'timelapse', 'tagfs', 'burble', 'ambient'];

type DialogoTareaProps = {
  abierto: boolean;
  usuario: Usuario;
  tarea?: TareaGestionada | null;
  onGuardar: (datos: DatosTarea, tareaId?: string) => ResultadoOperacionTarea;
  onCancelar: () => void;
};

/** Limpia la etiqueta mientras se escribe: minúsculas, sin espacios ni '#'. */
function limpiarEntradaEtiqueta(valor: string): string {
  return valor.toLowerCase().replace(/[\s#]+/g, '');
}

export function DialogoTarea(props: DialogoTareaProps) {
  if (!props.abierto) return null;
  return (
    <DialogoTareaModal
      key={props.tarea ? `editar-${props.tarea.id}` : 'nueva-tarea'}
      usuario={props.usuario}
      tarea={props.tarea}
      onGuardar={props.onGuardar}
      onCancelar={props.onCancelar}
    />
  );
}

function DialogoTareaModal({
  usuario,
  tarea,
  onGuardar,
  onCancelar,
}: Omit<DialogoTareaProps, 'abierto'>) {
  const esEdicion = Boolean(tarea);
  const appsHabilitadas = usuario.limites.appsHabilitadas;

  const appInicial: AppId = useMemo(() => {
    if (tarea && appsHabilitadas.includes(tarea.app)) return tarea.app;
    return APPS_TAREAS.find((id) => appsHabilitadas.includes(id)) ?? APPS_TAREAS[0];
  }, [tarea, appsHabilitadas]);

  const duracionInicial = useMemo(() => {
    if (tarea && (DURACIONES_PERMITIDAS as readonly number[]).includes(tarea.minutos)) {
      return String(tarea.minutos);
    }
    return String(DURACIONES_PERMITIDAS[1]); // 15 min por defecto
  }, [tarea]);

  const [titulo, setTitulo] = useState(tarea?.titulo ?? '');
  const [app, setApp] = useState<AppId>(appInicial);
  const [duracion, setDuracion] = useState<string>(duracionInicial);
  const [etiqueta, setEtiqueta] = useState(tarea?.etiqueta ?? '');
  const [importante, setImportante] = useState(tarea?.importante ?? false);
  const [errores, setErrores] = useState<{
    titulo?: string;
    app?: string;
    duracion?: string;
    etiqueta?: string;
    general?: string;
  }>({});

  const idTitulo = useId();
  const idEtiqueta = useId();
  const idImportante = useId();
  const idModalTitulo = useId();

  const onCancelarRef = useRef(onCancelar);
  const onGuardarRef = useRef(onGuardar);
  useEffect(() => {
    onCancelarRef.current = onCancelar;
    onGuardarRef.current = onGuardar;
  }, [onCancelar, onGuardar]);

  const inputTituloRef = useRef<HTMLInputElement>(null);
  const grupoAppRef = useRef<HTMLDivElement>(null);
  const grupoDuracionRef = useRef<HTMLDivElement>(null);
  const inputEtiquetaRef = useRef<HTMLInputElement>(null);
  const botonCancelarRef = useRef<HTMLButtonElement>(null);
  const botonGuardarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Foco inicial en Título UNA SOLA VEZ al abrir (no depende de reloj ni props)
    inputTituloRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelarRef.current();
      }
    };
    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, []);

  const opcionesApp: OpcionSegmentada<AppId>[] = useMemo(
    () =>
      APPS_TAREAS.map((id) => {
        const habilitada = appsHabilitadas.includes(id);
        const nombre = APPS[id].nombre;
        return {
          valor: id,
          etiqueta: nombre,
          deshabilitada: !habilitada,
          ariaLabel: habilitada ? nombre : `${nombre}: No disponible para tu perfil`,
          icono: habilitada ? (
            <IconoApp app={id} size={20} decorativo={true} />
          ) : (
            <Lock className="h-5 w-5 text-muted" aria-hidden="true" />
          ),
        };
      }),
    [appsHabilitadas]
  );

  const appsBloqueadas = useMemo(
    () => APPS_TAREAS.filter((id) => !appsHabilitadas.includes(id)).map((id) => APPS[id].nombre),
    [appsHabilitadas]
  );

  const opcionesDuracion: OpcionSegmentada<string>[] = useMemo(
    () =>
      DURACIONES_PERMITIDAS.map((min) => ({
        valor: String(min),
        etiqueta: `${min} min`,
      })),
    []
  );

  const manejarTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const radioApp =
      grupoAppRef.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]') ??
      grupoAppRef.current?.querySelector<HTMLElement>('[role="radio"]:not([aria-disabled="true"])');
    const radioDuracion = grupoDuracionRef.current?.querySelector<HTMLElement>(
      '[role="radio"][tabindex="0"]'
    );

    const orden = [
      inputTituloRef.current,
      radioApp ?? null,
      radioDuracion ?? null,
      inputEtiquetaRef.current,
      document.getElementById(idImportante),
      botonCancelarRef.current,
      botonGuardarRef.current,
    ].filter((el): el is HTMLElement => el !== null && !el.hasAttribute('disabled'));

    if (orden.length === 0) return;
    const primero = orden[0];
    const ultimo = orden[orden.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  const asignarErrorPorMotivo = (motivo: keyof typeof TEXTOS_MOTIVOS_TAREAS) => {
    const texto = TEXTOS_MOTIVOS_TAREAS[motivo];
    if (
      motivo === MOTIVOS_ERROR_TAREAS.TITULO_VACIO ||
      motivo === MOTIVOS_ERROR_TAREAS.TITULO_MUY_LARGO
    ) {
      setErrores({ titulo: texto });
      inputTituloRef.current?.focus();
    } else if (motivo === MOTIVOS_ERROR_TAREAS.APP_NO_HABILITADA) {
      setErrores({ app: texto });
    } else if (motivo === MOTIVOS_ERROR_TAREAS.DURACION_INVALIDA) {
      setErrores({ duracion: texto });
    } else if (
      motivo === MOTIVOS_ERROR_TAREAS.ETIQUETA_INVALIDA ||
      motivo === MOTIVOS_ERROR_TAREAS.ETIQUETA_MUY_LARGA
    ) {
      setErrores({ etiqueta: texto });
      inputEtiquetaRef.current?.focus();
    } else {
      setErrores({ general: texto });
    }
  };

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    const datos: DatosTarea = {
      titulo,
      app,
      minutos: Number(duracion),
      etiqueta,
      importante,
    };

    const validacion = validarTarea(datos, usuario);
    if (!validacion.ok) {
      asignarErrorPorMotivo(validacion.motivo);
      return;
    }

    const res = onGuardarRef.current(validacion.datos, tarea?.id);
    if (!res.ok) {
      asignarErrorPorMotivo(res.motivo);
    }
  };

  const tituloVacio = titulo.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 select-none"
      onClick={() => onCancelarRef.current()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idModalTitulo}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTab}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id={idModalTitulo} className="font-fredoka text-xl font-semibold text-ink">
            {esEdicion ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button
            type="button"
            aria-label="Cerrar diálogo"
            onClick={() => onCancelarRef.current()}
            className="rounded-full p-1.5 text-muted hover:bg-soft hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={manejarEnvio} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={idTitulo} className="text-sm font-semibold text-ink">
                  Título
                </label>
                <span className="text-xs text-muted" aria-hidden="true">
                  {titulo.length}/{LONGITUD_MAX_TITULO}
                </span>
              </div>
              <input
                ref={inputTituloRef}
                id={idTitulo}
                type="text"
                maxLength={LONGITUD_MAX_TITULO}
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errores.titulo) setErrores((prev) => ({ ...prev, titulo: undefined }));
                }}
                placeholder="Escribir borrador del informe"
                className="w-full rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {errores.titulo && (
                <p role="alert" className="text-xs font-semibold text-warm-ink">
                  {errores.titulo}
                </p>
              )}
            </div>

            {/* App */}
            <div className="flex flex-col gap-1.5" ref={grupoAppRef}>
              <span className="text-sm font-semibold text-ink">App</span>
              <SelectorSegmentado<AppId>
                ariaLabel="App"
                disposicion="vertical-icono"
                opciones={opcionesApp}
                valorSeleccionado={app}
                onSeleccionar={(v) => {
                  setApp(v);
                  if (errores.app) setErrores((prev) => ({ ...prev, app: undefined }));
                }}
              />
              {appsBloqueadas.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {appsBloqueadas.join(', ')}: No disponible para tu perfil
                  </span>
                </p>
              )}
              {errores.app && (
                <p role="alert" className="text-xs font-semibold text-warm-ink">
                  {errores.app}
                </p>
              )}
            </div>

            {/* Duración */}
            <div className="flex flex-col gap-1.5" ref={grupoDuracionRef}>
              <span className="text-sm font-semibold text-ink">Duración</span>
              <SelectorSegmentado<string>
                ariaLabel="Duración"
                opciones={opcionesDuracion}
                valorSeleccionado={duracion}
                onSeleccionar={(v) => {
                  setDuracion(v);
                  if (errores.duracion) setErrores((prev) => ({ ...prev, duracion: undefined }));
                }}
              />
              {errores.duracion && (
                <p role="alert" className="text-xs font-semibold text-warm-ink">
                  {errores.duracion}
                </p>
              )}
            </div>

            {/* Etiqueta */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={idEtiqueta} className="text-sm font-semibold text-ink">
                  Etiqueta
                </label>
                <span className="text-xs text-muted" aria-hidden="true">
                  {etiqueta.length}/{LONGITUD_MAX_ETIQUETA}
                </span>
              </div>
              <div className="flex items-center rounded-2xl border border-line bg-bg px-4 py-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
                <span className="mr-1.5 text-sm font-semibold text-muted select-none" aria-hidden="true">
                  #
                </span>
                <input
                  ref={inputEtiquetaRef}
                  id={idEtiqueta}
                  type="text"
                  maxLength={LONGITUD_MAX_ETIQUETA}
                  value={etiqueta}
                  onChange={(e) => {
                    setEtiqueta(limpiarEntradaEtiqueta(e.target.value));
                    if (errores.etiqueta) setErrores((prev) => ({ ...prev, etiqueta: undefined }));
                  }}
                  placeholder="estudio"
                  className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 outline-none"
                />
              </div>
              {errores.etiqueta && (
                <p role="alert" className="text-xs font-semibold text-warm-ink">
                  {errores.etiqueta}
                </p>
              )}
            </div>

            {/* Importante */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-soft/30 px-4 py-3">
              <div className="flex flex-col">
                <label htmlFor={idImportante} className="text-sm font-semibold text-ink">
                  Importante
                </label>
                <span className="text-xs text-muted">
                  Aparecerá primero en tus sugerencias.
                </span>
              </div>
              <Interruptor
                id={idImportante}
                activo={importante}
                onAlternar={setImportante}
                ariaLabel="Importante"
              />
            </div>

            {errores.general && (
              <p role="alert" className="text-xs font-semibold text-warm-ink">
                {errores.general}
              </p>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-line bg-card px-6 py-4">
            <Boton
              ref={botonCancelarRef}
              type="button"
              variante="secundario"
              onClick={() => onCancelarRef.current()}
              className="!px-5 !py-2 text-sm"
            >
              Cancelar
            </Boton>
            <Boton
              ref={botonGuardarRef}
              type="submit"
              variante="principal"
              deshabilitado={tituloVacio}
              className="!px-5 !py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar tarea
            </Boton>
          </footer>
        </form>
      </div>
    </div>
  );
}
