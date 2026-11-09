import { useState, useMemo } from 'react';
import { Layers, ArrowLeftRight, Clock } from 'lucide-react';
import { usePlanificador } from '../../store/planificador';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { PID_KERNEL } from '../../kernel/processes/constantes';
import {
  calcularPrioridadEfectiva,
  quantumPara,
} from '../../kernel/scheduler/planificador';
import {
  PROCESOS_DEMO,
  VelocidadPlanificador,
} from '../../config/planificador';
import { APPS } from '../../config/apps';
import { AppId, PCB } from '../../kernel/types';
import { BarraProgreso } from '../components/BarraProgreso';
import { PildoraEstado } from '../components/PildoraEstado';
import { SelectorSegmentado, OpcionSegmentada } from '../components/SelectorSegmentado';
import { Boton } from '../components/Boton';
import { formatearTiempoSimulado } from '../../kernel/scheduler/formato';

const OPCIONES_VELOCIDAD: readonly OpcionSegmentada<string>[] = [
  { valor: '1', etiqueta: '×1' },
  { valor: '5', etiqueta: '×5' },
  { valor: '10', etiqueta: '×10' },
];

function obtenerNombreVisible(proceso: PCB): string {
  const info = APPS[proceso.nombre as AppId];
  return info?.nombre ?? proceso.nombre;
}

export function PanelPlanificador() {
  const ticks = usePlanificador((s) => s.ticks);
  const cambiosContexto = usePlanificador((s) => s.cambiosContexto);
  const procesoEnCpuPid = usePlanificador((s) => s.procesoEnCpuPid);
  const velocidad = usePlanificador((s) => s.velocidad);
  const cambiarVelocidad = usePlanificador((s) => s.cambiarVelocidad);
  const agregarProcesosDePrueba = usePlanificador((s) => s.agregarProcesosDePrueba);
  const quitarProcesosDePrueba = usePlanificador((s) => s.quitarProcesosDePrueba);

  const procesos = useProcesos((s) => s.procesos);
  const focusPid = useVentanas((s) => s.focusPid);
  const ventanas = useVentanas((s) => s.ventanas);

  // Mensaje accesible exclusivo para cambios de configuración (NO en cada tick)
  const [anuncioLive, setAnuncioLive] = useState<string | null>(null);

  // Determinar el PID de la ventana enfocada para la bonificación de foco
  const idProcesoEnFoco = useMemo(() => {
    if (!focusPid) return null;
    const v = ventanas.find((w) => w.id === focusPid);
    return v ? v.pid : null;
  }, [focusPid, ventanas]);

  // Proceso de usuario en CPU (excluyendo el Kernel)
  const procesoEnCpu = useMemo(() => {
    if (procesoEnCpuPid === null || procesoEnCpuPid === PID_KERNEL) return null;
    return procesos.find((p) => p.pid === procesoEnCpuPid && p.estado === 'En ejecución') ?? null;
  }, [procesoEnCpuPid, procesos]);

  // Procesos en la cola de Listos ordenados por prioridad de selección
  const colaListos = useMemo(() => {
    return procesos
      .filter((p) => p.pid !== PID_KERNEL && p.estado === 'Listo')
      .sort((a, b) => {
        const priorA = a.prioridadEfectiva ?? calcularPrioridadEfectiva(a, idProcesoEnFoco);
        const priorB = b.prioridadEfectiva ?? calcularPrioridadEfectiva(b, idProcesoEnFoco);
        if (priorB !== priorA) return priorB - priorA;

        const esperaA = a.ticksEsperando ?? 0;
        const esperaB = b.ticksEsperando ?? 0;
        if (esperaB !== esperaA) return esperaB - esperaA;

        return a.pid - b.pid;
      });
  }, [procesos, idProcesoEnFoco]);

  // Métricas del proceso en CPU
  const metricasCpu = useMemo(() => {
    if (!procesoEnCpu) return null;
    const quantumTotal = quantumPara(procesoEnCpu, idProcesoEnFoco);
    const quantumRestante = procesoEnCpu.quantumRestante ?? 0;
    // Ticks consumidos en el turno actual (1 a quantumTotal)
    const ticksConsumidos = Math.max(0, quantumTotal - quantumRestante);
    const porcentaje = Math.min(100, Math.max(0, Math.round((ticksConsumidos / quantumTotal) * 100)));
    const prioridadEfectiva = procesoEnCpu.prioridadEfectiva ?? calcularPrioridadEfectiva(procesoEnCpu, idProcesoEnFoco);

    return {
      nombre: obtenerNombreVisible(procesoEnCpu),
      pid: procesoEnCpu.pid,
      prioridadEfectiva,
      ticksConsumidos,
      quantumTotal,
      porcentaje,
    };
  }, [procesoEnCpu, idProcesoEnFoco]);

  // Estado de los procesos demo de prueba
  const hayDemos = useMemo(() => {
    return procesos.some((p) => p.esDemo && p.estado !== 'Terminado');
  }, [procesos]);

  const todosLosDemosEstan = useMemo(() => {
    return PROCESOS_DEMO.every((demo) =>
      procesos.some(
        (p) => p.esDemo && p.nombre === demo.nombre && p.estado !== 'Terminado'
      )
    );
  }, [procesos]);

  const manejarCambiarVelocidad = (val: string) => {
    const nuevaVelocidad = Number(val) as VelocidadPlanificador;
    cambiarVelocidad(nuevaVelocidad);
    setAnuncioLive(`Velocidad de simulación cambiada a ${val}`);
  };

  const manejarAgregarDemos = () => {
    const res = agregarProcesosDePrueba();
    setAnuncioLive(
      res.agregados > 0
        ? `Se añadieron ${res.agregados} procesos de prueba.`
        : 'No se pudieron añadir más procesos de prueba.'
    );
  };

  const manejarQuitarDemos = () => {
    quitarProcesosDePrueba();
    setAnuncioLive('Procesos de prueba eliminados.');
  };

  return (
    <div
      id="panel-planificador"
      role="tabpanel"
      aria-labelledby="tab-planificador"
      tabIndex={0}
      className="flex flex-col gap-6 p-6 outline-none"
    >
      {/* Región ARIA en vivo para cambios de configuración únicamente */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {anuncioLive}
      </div>

      {/* ─── Tres tarjetas de resumen ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-2xs">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-accent-strong">
            <Layers size={20} aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-ink leading-snug">
            Algoritmo: Round Robin con prioridades
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-2xs">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-accent-strong">
            <ArrowLeftRight size={20} aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-ink leading-snug">
            Cambios de contexto: {cambiosContexto}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-2xs">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-accent-strong">
            <Clock size={20} aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-ink leading-snug">
            Tiempo simulado: {formatearTiempoSimulado(ticks)}
          </span>
        </div>
      </div>

      {/* ─── Fila central: Procesador y Cola de listos ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tarjeta Procesador (borde de acento) */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-accent/60 bg-card p-5 shadow-2xs min-h-[220px]">
          <div className="flex items-center justify-between">
            <h3 className="font-fredoka text-lg font-semibold text-ink">
              Procesador
            </h3>
            {procesoEnCpu ? (
              <PildoraEstado estado="En ejecución" />
            ) : (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-line/60 text-muted">
                Libre
              </span>
            )}
          </div>

          {metricasCpu ? (
            <div className="my-auto py-2">
              <h4 className="font-fredoka text-2xl font-bold text-ink">
                {metricasCpu.nombre}
              </h4>
              <p className="text-xs font-semibold text-muted mt-0.5">
                PID {metricasCpu.pid} · Prioridad {metricasCpu.prioridadEfectiva}
              </p>
            </div>
          ) : (
            <div className="my-auto py-4 text-center">
              <h4 className="font-fredoka text-xl font-semibold text-ink">
                Procesador libre
              </h4>
              <p className="text-xs text-muted mt-1">
                No hay procesos compitiendo por CPU en este momento.
              </p>
            </div>
          )}

          {metricasCpu && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>
                  Turno {metricasCpu.ticksConsumidos} de {metricasCpu.quantumTotal}
                </span>
                <span>{metricasCpu.porcentaje} %</span>
              </div>
              <BarraProgreso
                valor={metricasCpu.porcentaje}
                color="acento"
                etiqueta={`Turno de CPU: ${metricasCpu.ticksConsumidos} de ${metricasCpu.quantumTotal}`}
                className="w-full mt-2 h-2.5 motion-reduce:transition-none"
              />
            </div>
          )}
        </div>

        {/* Tarjeta Cola de listos */}
        <div className="flex flex-col justify-between rounded-3xl border border-line bg-card p-5 shadow-2xs min-h-[220px]">
          <div className="flex items-center justify-between">
            <h3 className="font-fredoka text-lg font-semibold text-ink">
              Cola de listos
            </h3>
            <span className="text-xs font-semibold text-muted">
              {colaListos.length} en espera
            </span>
          </div>

          <div className="my-auto py-2">
            {colaListos.length > 0 ? (
              <div className="flex flex-col gap-3.5 max-h-[170px] overflow-y-auto pr-1">
                {colaListos.map((p) => {
                  const nombre = obtenerNombreVisible(p);
                  const prioridad = p.prioridadEfectiva ?? calcularPrioridadEfectiva(p, idProcesoEnFoco);
                  const espera = p.ticksEsperando ?? 0;
                  // Escala visual de espera (10 ticks de espera = 100%)
                  const porcentajeEspera = Math.min(100, Math.round((espera / 10) * 100));

                  return (
                    <div key={p.pid} className="flex flex-col">
                      <div className="flex items-center justify-between text-xs font-semibold text-ink">
                        <span>
                          {nombre} · Prioridad {prioridad} · Esperando {espera} s
                        </span>
                        <span className="text-muted font-bold text-2xs">
                          {porcentajeEspera} %
                        </span>
                      </div>
                      <BarraProgreso
                        valor={porcentajeEspera}
                        color="acento"
                        etiqueta={`Espera de ${nombre}: ${espera} segundos`}
                        className="w-full mt-1.5 h-1.5 motion-reduce:transition-none"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm font-semibold text-muted">
                  No hay procesos esperando.
                </p>
              </div>
            )}
          </div>

          <div className="h-2" aria-hidden="true" />
        </div>
      </div>

      {/* ─── Fila inferior: Controles y Botones ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-bold text-ink shrink-0">
            Velocidad
          </span>
          <SelectorSegmentado
            opciones={OPCIONES_VELOCIDAD}
            valorSeleccionado={String(velocidad)}
            onSeleccionar={manejarCambiarVelocidad}
            ariaLabel="Velocidad del planificador"
            className="!w-auto"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Boton
            variante="secundario"
            deshabilitado={todosLosDemosEstan}
            onClick={manejarAgregarDemos}
            className="!min-h-[38px] !px-4 text-xs font-bold"
          >
            Añadir procesos de prueba
          </Boton>
          <Boton
            variante="secundario"
            deshabilitado={!hayDemos}
            onClick={manejarQuitarDemos}
            className="!min-h-[38px] !px-4 text-xs font-bold"
          >
            Quitar procesos de prueba
          </Boton>
        </div>
      </div>

      {/* Frase didáctica */}
      <p className="text-center text-xs text-muted">
        Los procesos esperan su turno, pero las apps siguen funcionando: es una simulación.
      </p>
    </div>
  );
}
