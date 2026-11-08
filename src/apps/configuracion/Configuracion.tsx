import { useState } from 'react';
import { Palette, Type, Accessibility, Info } from 'lucide-react';
import { SelectorTema } from '../../ui/components/SelectorTema';
import { SelectorSegmentado, OpcionSegmentada } from '../../ui/components/SelectorSegmentado';
import { Interruptor } from '../../ui/components/Interruptor';
import { usePreferenciasStore } from '../../store/preferencias';
import { PreferenciaTamanoTexto } from '../../config/preferencias';
import { useTema } from '../../store/tema';

type SeccionConfiguracion = 'apariencia' | 'texto' | 'accesibilidad';

const OPCIONES_TEXTO: OpcionSegmentada<PreferenciaTamanoTexto>[] = [
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'grande', etiqueta: 'Grande' },
  { id: 'muy-grande', etiqueta: 'Muy grande' },
];

export function Configuracion() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionConfiguracion>('apariencia');

  const {
    movimiento,
    contraste,
    tamanoTexto,
    setMovimiento,
    alternarContraste,
    setTamanoTexto,
  } = usePreferenciasStore();

  const { temaEfectivo } = useTema();

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

              <p className="flex items-center gap-2 text-xs text-muted mt-1">
                <Info size={14} className="text-accent shrink-0" aria-hidden="true" />
                <span>Ajusta la escala tipográfica de todo el sistema.</span>
              </p>

              <div className="h-px w-full bg-line/60 my-3" aria-hidden="true" />

              {/* Vista previa */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-muted uppercase">
                  Vista previa
                </span>

                <div
                  aria-live="polite"
                  className="rounded-3xl border border-line bg-soft/30 p-6 flex items-center justify-center text-center"
                >
                  <p className="text-ink font-semibold">
                    Así se verá el texto del sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Sección Accesibilidad ────────────────────────────────────── */}
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

              <div className="flex flex-col gap-3 pt-1">
                {/* Interruptor Reducir el movimiento */}
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card/70 p-4">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <span className="text-sm font-bold text-ink">
                      Reducir el movimiento
                    </span>
                    <span className="text-xs text-muted">
                      Quita las transiciones y animaciones.
                    </span>
                  </div>
                  <Interruptor
                    activo={movimiento === 'reducir'}
                    onAlternar={() =>
                      setMovimiento(movimiento === 'reducir' ? 'sistema' : 'reducir')
                    }
                    etiqueta="Reducir el movimiento"
                  />
                </div>

                {/* Interruptor Contraste alto */}
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card/70 p-4">
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
    </div>
  );
}
