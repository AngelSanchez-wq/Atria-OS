import { useEffect, useRef } from 'react';
import { Wifi, Lock, Check } from 'lucide-react';
import { Interruptor } from '../components/Interruptor';
import { RedWifi } from '../../store/red';

export type PanelWifiProps = {
  abierto: boolean;
  enLinea: boolean;
  calidad?: string;
  wifiHabilitado: boolean;
  redConectadaId: string | null;
  conectandoId?: string | null;
  redes: RedWifi[];
  onCerrar: () => void;
  onAlternarWifi: (habilitado: boolean) => void;
  onConectarRed: (id: string) => void;
};

export function PanelWifi({
  abierto,
  enLinea,
  calidad,
  wifiHabilitado,
  redConectadaId,
  conectandoId,
  redes,
  onCerrar,
  onAlternarWifi,
  onConectarRed,
}: PanelWifiProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    // Foco inicial accesible al abrir
    const timer = setTimeout(() => {
      const primerElemento = panelRef.current?.querySelector<HTMLElement>(
        'button, input, [tabindex="0"]'
      );
      primerElemento?.focus();
    }, 0);

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };

    const alClicFuera = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    window.addEventListener('mousedown', alClicFuera);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', alPulsarTecla);
      window.removeEventListener('mousedown', alClicFuera);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const redConectada = redes.find((r) => r.id === redConectadaId);

  // Subtítulo descriptivo
  let subtitulo = 'Desconectado';
  if (!wifiHabilitado) {
    subtitulo = 'Desactivado';
  } else if (!enLinea) {
    subtitulo = 'Sin conexión a internet';
  } else if (conectandoId) {
    subtitulo = 'Conectando…';
  } else if (redConectada) {
    subtitulo = `Conectado a ${redConectada.nombre}`;
  }

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Panel de Wi-Fi"
      className="absolute right-44 top-12 z-50 flex w-80 flex-col gap-3.5 rounded-3xl border border-line bg-card p-4 shadow-xl select-none"
    >
      {/* Cabecera con título e interruptor */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-fredoka text-base font-semibold text-ink">Wi-Fi</h3>
          <p className="text-xs text-muted font-medium mt-0.5">{subtitulo}</p>
        </div>
        <Interruptor
          id="switch-wifi"
          activo={wifiHabilitado}
          onAlternar={onAlternarWifi}
          ariaLabel="Activar Wi-Fi"
        />
      </div>

      {/* Sección 1: Tu conexión (Estado real) */}
      <div className="flex flex-col gap-1 rounded-2xl border border-line/70 bg-soft/40 p-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Tu conexión
        </span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            {enLinea ? 'Conectado a internet' : 'Sin conexión'}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              enLinea ? 'bg-accent' : 'bg-muted'
            }`}
            aria-hidden="true"
          />
        </div>
        {calidad && enLinea && (
          <span className="text-xs text-muted leading-tight">
            Calidad: {calidad}
          </span>
        )}
      </div>

      {/* Sección 2: Redes de ejemplo (Simuladas) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Redes de ejemplo
        </span>

        {!wifiHabilitado ? (
          <div className="py-4 text-center">
            <p className="text-xs font-semibold text-muted">
              El Wi-Fi está desactivado.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {redes.map((red) => {
              const esConectada = red.id === redConectadaId;
              const estaConectando = red.id === conectandoId;

              return (
                <button
                  key={red.id}
                  type="button"
                  onClick={() => onConectarRed(red.id)}
                  disabled={estaConectando}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    esConectada
                      ? 'bg-soft text-ink border border-accent/30 shadow-2xs'
                      : 'text-ink hover:bg-soft/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wifi
                      size={16}
                      className={esConectada ? 'text-accent' : 'text-muted'}
                      aria-hidden="true"
                    />
                    <span>{red.nombre}</span>
                    {red.seguridad && (
                      <Lock
                        size={12}
                        className="text-muted"
                        aria-label="Red protegida"
                      />
                    )}
                  </div>

                  {estaConectando ? (
                    <span className="text-2xs font-bold text-accent">
                      Conectando…
                    </span>
                  ) : esConectada ? (
                    <Check
                      size={16}
                      className="text-accent stroke-[2.5]"
                      aria-label="Conectada"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nota legal y didáctica */}
      <p className="text-center text-[11px] text-muted leading-tight pt-1">
        Los navegadores no permiten ver las redes reales. Atria-OS es una simulación.
      </p>
    </div>
  );
}
