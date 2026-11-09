import { useState, useRef } from 'react';
import { Palette, Type, Accessibility, Info, User, Camera, Trash2 } from 'lucide-react';
import { SelectorTema } from '../../ui/components/SelectorTema';
import { SelectorSegmentado, OpcionSegmentada } from '../../ui/components/SelectorSegmentado';
import { Interruptor } from '../../ui/components/Interruptor';
import { Boton } from '../../ui/components/Boton';
import { Avatar } from '../../ui/components/Avatar';
import { Dialogo } from '../../ui/components/Dialogo';
import { DialogoAjustarFoto } from './DialogoAjustarFoto';
import { usePreferenciasStore } from '../../store/preferencias';
import { PreferenciaTamanoTexto } from '../../config/preferencias';
import { useTema } from '../../store/tema';
import { useSesion } from '../../store/sesion';
import { useUsuariosStore } from '../../store/usuarios';
import { validarArchivoFoto } from '../../kernel/users/foto';
import { platform } from '../../platform/web';
import { VistaPreviaFoto } from '../../platform/types';

type SeccionConfiguracion = 'perfil' | 'apariencia' | 'texto' | 'accesibilidad';

const OPCIONES_TEXTO: OpcionSegmentada<PreferenciaTamanoTexto>[] = [
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'grande', etiqueta: 'Grande' },
  { id: 'muy-grande', etiqueta: 'Muy grande' },
];

export function Configuracion() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionConfiguracion>('perfil');
  const usuario = useSesion((s) => s.usuario);
  const cambiarFotoStore = useUsuariosStore((s) => s.cambiarFoto);
  const quitarFotoStore = useUsuariosStore((s) => s.quitarFoto);

  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [vistaPreviaActual, setVistaPreviaActual] = useState<VistaPreviaFoto | null>(null);
  const [dialogoAjustarAbierto, setDialogoAjustarAbierto] = useState(false);
  const [dialogoConfirmarQuitar, setDialogoConfirmarQuitar] = useState(false);

  const {
    movimiento,
    contraste,
    tamanoTexto,
    setMovimiento,
    alternarContraste,
    setTamanoTexto,
  } = usePreferenciasStore();

  const { temaEfectivo } = useTema();

  const manejarArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorArchivo(null);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Resetear valor para permitir seleccionar el mismo archivo si se desea reintentar
    e.target.value = '';

    const validacion = validarArchivoFoto({
      tipo: archivo.type,
      tamano: archivo.size,
    });

    if (!validacion.ok) {
      if (validacion.motivo === 'formato-no-permitido') {
        setErrorArchivo('Ese formato no está permitido. Usa PNG, JPG o WebP.');
      } else {
        setErrorArchivo('La imagen es muy grande. Elige una de hasta 5 MB.');
      }
      return;
    }

    try {
      const vistaPrevia = await platform.obtenerVistaPreviaFoto(archivo);
      setArchivoSeleccionado(archivo);
      setVistaPreviaActual(vistaPrevia);
      setDialogoAjustarAbierto(true);
    } catch {
      setErrorArchivo('No se pudo abrir la imagen. Intenta con otra.');
    }
  };

  const manejarGuardarFoto = async (dataUrl: string) => {
    if (!usuario) return;
    const res = cambiarFotoStore(usuario, usuario.id, dataUrl);
    if (!res.ok) {
      throw new Error(res.motivo);
    }
    setDialogoAjustarAbierto(false);
    setArchivoSeleccionado(null);
    setVistaPreviaActual(null);
  };

  const manejarCerrarDialogoAjustar = () => {
    setDialogoAjustarAbierto(false);
    setArchivoSeleccionado(null);
    setVistaPreviaActual(null);
  };

  const manejarConfirmarQuitar = () => {
    if (usuario) {
      quitarFotoStore(usuario, usuario.id);
    }
    setDialogoConfirmarQuitar(false);
  };

  return (
    <div
      role="region"
      aria-label="Configuración del sistema"
      className="flex h-full w-full bg-card select-none overflow-hidden"
    >
      {/* Menú lateral */}
      <aside className="w-56 shrink-0 border-r border-line bg-card/50 p-4 flex flex-col gap-1">
        <nav
          role="tablist"
          aria-label="Secciones de configuración"
          aria-orientation="vertical"
          className="flex flex-col gap-1.5"
        >
          <button
            type="button"
            role="tab"
            id="tab-perfil"
            aria-selected={seccionActiva === 'perfil'}
            aria-controls="panel-perfil"
            onClick={() => setSeccionActiva('perfil')}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              seccionActiva === 'perfil'
                ? 'bg-soft text-accent font-bold shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-soft/40 font-semibold'
            }`}
          >
            <User size={18} aria-hidden="true" />
            <span>Mi perfil</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-apariencia"
            aria-selected={seccionActiva === 'apariencia'}
            aria-controls="panel-apariencia"
            onClick={() => setSeccionActiva('apariencia')}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              seccionActiva === 'apariencia'
                ? 'bg-soft text-accent font-bold shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-soft/40 font-semibold'
            }`}
          >
            <Palette size={18} aria-hidden="true" />
            <span>Apariencia</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-texto"
            aria-selected={seccionActiva === 'texto'}
            aria-controls="panel-texto"
            onClick={() => setSeccionActiva('texto')}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              seccionActiva === 'texto'
                ? 'bg-soft text-accent font-bold shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-soft/40 font-semibold'
            }`}
          >
            <Type size={18} aria-hidden="true" />
            <span>Texto</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-accesibilidad"
            aria-selected={seccionActiva === 'accesibilidad'}
            aria-controls="panel-accesibilidad"
            onClick={() => setSeccionActiva('accesibilidad')}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              seccionActiva === 'accesibilidad'
                ? 'bg-soft text-accent font-bold shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-soft/40 font-semibold'
            }`}
          >
            <Accessibility size={18} aria-hidden="true" />
            <span>Accesibilidad</span>
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto p-8">
        <div className="flex-1">
          {/* ─── Sección Mi perfil ───────────────────────────────────────── */}
          {seccionActiva === 'perfil' && usuario && (
            <div
              id="panel-perfil"
              role="tabpanel"
              aria-labelledby="tab-perfil"
              className="flex flex-col gap-6 max-w-xl"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-2xl font-semibold text-ink">
                  Mi perfil
                </h2>
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <Avatar
                  nombre={usuario.nombre}
                  inicial={usuario.inicial}
                  esAdmin={usuario.rol === 'admin'}
                  foto={usuario.foto}
                  tamanoPx={120}
                  mostrarNombre={false}
                />

                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-fredoka text-2xl font-semibold text-ink">
                      {usuario.nombre}
                    </h3>
                    <p className="text-sm font-medium text-muted">
                      {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      ref={inputArchivoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={manejarArchivoSeleccionado}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />

                    <Boton
                      variante="principal"
                      onClick={() => inputArchivoRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera size={16} aria-hidden="true" />
                      <span>Cambiar foto</span>
                    </Boton>

                    {usuario.foto && (
                      <Boton
                        variante="secundario"
                        onClick={() => setDialogoConfirmarQuitar(true)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        <span>Quitar foto</span>
                      </Boton>
                    )}
                  </div>

                  {errorArchivo && (
                    <p role="alert" className="text-xs text-warm-ink font-medium">
                      {errorArchivo}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted max-w-md pt-4">
                La foto se guarda solo en este equipo. Formatos: PNG, JPG o WebP, hasta 5 MB.
              </p>
            </div>
          )}

          {/* ─── Sección Apariencia ────────────────────────────────────────── */}
          {seccionActiva === 'apariencia' && (
            <div
              id="panel-apariencia"
              role="tabpanel"
              aria-labelledby="tab-apariencia"
              className="flex flex-col gap-5 max-w-xl"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-2xl font-semibold text-ink">
                  Tema
                </h2>
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              </div>

              {/* Selector de tema reutilizado */}
              <div className="pt-1">
                <SelectorTema />
              </div>

              <p className="flex items-center gap-2 text-xs text-muted mt-1">
                <Info size={14} className="text-accent shrink-0" aria-hidden="true" />
                <span>El tema se guarda en este equipo.</span>
              </p>

              <div className="h-px w-full bg-line/60 my-3" aria-hidden="true" />

              {/* Muestra del entorno */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-muted uppercase">
                  Muestra del entorno
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-all ${
                      temaEfectivo === 'claro'
                        ? 'border-accent bg-soft/40 shadow-xs'
                        : 'border-line bg-card/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Luz natural</span>
                      {temaEfectivo === 'claro' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      )}
                    </div>
                    <div className="h-2 w-14 rounded-full bg-line/60" />
                  </div>

                  <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Equilibrio</span>
                    </div>
                    <div className="h-2 w-16 rounded-full bg-line/60" />
                  </div>

                  <div
                    className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-all ${
                      temaEfectivo === 'oscuro'
                        ? 'border-accent bg-soft/40 shadow-xs'
                        : 'border-line bg-card/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Bajo brillo</span>
                      {temaEfectivo === 'oscuro' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      )}
                    </div>
                    <div className="h-2 w-14 rounded-full bg-line/60" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Sección Texto ────────────────────────────────────────────── */}
          {seccionActiva === 'texto' && (
            <div
              id="panel-texto"
              role="tabpanel"
              aria-labelledby="tab-texto"
              className="flex flex-col gap-5 max-w-xl"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-2xl font-semibold text-ink">
                  Tamaño del texto
                </h2>
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              </div>

              <div className="pt-1">
                <SelectorSegmentado<PreferenciaTamanoTexto>
                  opciones={OPCIONES_TEXTO}
                  valorActual={tamanoTexto}
                  onSeleccionar={setTamanoTexto}
                  etiquetaAria="Selector de tamaño de texto"
                />
              </div>

              <p className="text-xs text-muted mt-1">
                Ajusta el tamaño general de la interfaz para una lectura cómoda.
              </p>

              <div className="h-px w-full bg-line/60 my-3" aria-hidden="true" />

              <div className="rounded-2xl border border-line bg-soft/30 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                  Vista previa
                </span>
                <p className="text-base text-ink">
                  Así se verá el texto del sistema.
                </p>
              </div>
            </div>
          )}

          {/* ─── Sección Accesibilidad ─────────────────────────────────────── */}
          {seccionActiva === 'accesibilidad' && (
            <div
              id="panel-accesibilidad"
              role="tabpanel"
              aria-labelledby="tab-accesibilidad"
              className="flex flex-col gap-5 max-w-xl"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-2xl font-semibold text-ink">
                  Accesibilidad
                </h2>
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              </div>

              <div className="flex flex-col divide-y divide-line/60">
                {/* Reducir movimiento */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <span className="text-sm font-bold text-ink">
                      Reducir el movimiento
                    </span>
                    <span className="text-xs text-muted">
                      Desactiva animaciones de apertura, cierre y transiciones.
                    </span>
                  </div>
                  <Interruptor
                    activo={movimiento === 'reducir'}
                    onAlternar={(activo) => setMovimiento(activo ? 'reducir' : 'sistema')}
                    etiqueta="Reducir el movimiento"
                  />
                </div>

                {/* Contraste alto */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <span className="text-sm font-bold text-ink">
                      Contraste alto
                    </span>
                    <span className="text-xs text-muted">
                      Hace los textos y bordes más marcados.
                    </span>
                  </div>
                  <Interruptor
                    activo={contraste === 'alto'}
                    onAlternar={alternarContraste}
                    etiqueta="Contraste alto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de configuración */}
        <footer className="flex items-center justify-between border-t border-line/60 pt-4 mt-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            <span>Atria-OS v2.4 Estable</span>
          </div>
          <span>Sincronizado localmente</span>
        </footer>
      </main>

      {/* Diálogo para recortar y ajustar la foto seleccionada */}
      {dialogoAjustarAbierto && archivoSeleccionado && vistaPreviaActual && (
        <DialogoAjustarFoto
          abierto={dialogoAjustarAbierto}
          archivo={archivoSeleccionado}
          vistaPrevia={vistaPreviaActual}
          procesarImagen={(arch, recorte) => platform.procesarImagen(arch, recorte)}
          onGuardar={manejarGuardarFoto}
          onCancelar={manejarCerrarDialogoAjustar}
        />
      )}

      {/* Diálogo de confirmación para quitar foto de perfil */}
      <Dialogo
        abierto={dialogoConfirmarQuitar}
        titulo="¿Quitar foto de perfil?"
        mensaje="Volverás a ver tus iniciales como imagen de perfil. Podrás subir una nueva foto cuando quieras."
        textoConfirmar="Quitar foto"
        textoCancelar="Cancelar"
        onConfirmar={manejarConfirmarQuitar}
        onCancelar={() => setDialogoConfirmarQuitar(false)}
      />
    </div>
  );
}
