import { useEffect, useRef } from 'react';
import { Battery, BatteryCharging, Zap } from 'lucide-react';
import { BarraProgreso } from '../components/BarraProgreso';
import { Interruptor } from '../components/Interruptor';
import { EstadoBateria } from '../../kernel/power/bateria';

export type PanelBateriaProps = {
  abierto: boolean;
  nivel: number;
  cargando: boolean;
  estado: EstadoBateria;
  tiempoRestante: string | null;
  esSimulada: boolean;
  ahorroEnergia: boolean;
  onCerrar: () => void;
  onAlternarAhorroEnergia: (activo: boolean) => void;
};

export function PanelBateria({
  abierto,
  nivel,
  cargando,
  estado,
  tiempoRestante,
  esSimulada,
  ahorroEnergia,
  onCerrar,
  onAlternarAhorroEnergia,
}: PanelBateriaProps) {
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

  const colorBarra = nivel <= 20 ? 'calido' : 'acento';

  let etiquetaEstado = 'Descargando';
  if (cargando) {
    etiquetaEstado = nivel >= 100 ? 'Lleno' : 'Cargando';
  } else if (estado === 'critico') {
    etiquetaEstado = 'Batería crítica';
  } else if (estado === 'bajo') {
    etiquetaEstado = 'Batería baja';
  } else if (estado === 'lleno') {
    etiquetaEstado = 'Lleno';
  }

  const detalleEstado = tiempoRestante
    ? `${etiquetaEstado} · ${tiempoRestante}`
    : etiquetaEstado;

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Panel de batería"
      className="absolute right-28 top-12 z-50 flex w-72 flex-col gap-4 rounded-3xl border border-line bg-card p-4 shadow-xl select-none"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="font-fredoka text-base font-semibold text-ink">Batería</h3>
        {esSimulada && (
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            Valor de ejemplo
          </span>
        )}
      </div>

      {/* Sección principal: porcentaje grande, icono y barra de progreso */}
      <div className="flex flex-col gap-2 rounded-2xl border border-line/70 bg-soft/40 p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-fredoka text-3xl font-bold text-ink">
            {nivel} %
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-accent shadow-2xs">
            {cargando ? (
              <BatteryCharging size={22} aria-hidden="true" />
            ) : (
              <Battery size={22} aria-hidden="true" />
            )}
          </span>
        </div>

        <BarraProgreso
          valor={nivel}
          color={colorBarra}
          etiqueta={`Nivel de batería: ${nivel} %`}
          className="w-full mt-1 h-2.5 motion-reduce:transition-none"
        />

        <p className="text-xs font-semibold text-muted mt-1 leading-snug">
          {detalleEstado}
        </p>
      </div>

      {/* Control de Ahorro de Energía (reutiliza movimiento reducido) */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-soft text-accent">
            <Zap size={16} aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-bold text-ink block">
              Ahorro de energía
            </span>
            <span className="text-[11px] text-muted leading-tight block">
              Reduce movimiento y animaciones
            </span>
          </div>
        </div>

        <Interruptor
          id="switch-ahorro-energia"
          activo={ahorroEnergia}
          onAlternar={onAlternarAhorroEnergia}
          ariaLabel="Ahorro de energía"
        />
      </div>
    </div>
  );
}
