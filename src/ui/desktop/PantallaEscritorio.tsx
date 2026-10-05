import { useEffect } from 'react';
import { useTareas } from '../../store/tareas';
import { BarraSistema } from '../systembar/BarraSistema';
import { Dock } from './Dock';
import { TarjetaTareaActiva } from './TarjetaTareaActiva';
import { FranjaPendientes } from './FranjaPendientes';
import { FACTOR_VELOCIDAD_DEMO } from '../../config/tiempo';
import { CUPO_MAXIMO_TAREAS } from '../../config/escritorio';

export function PantallaEscritorio() {
  const { tareaActiva, estado, segundosTranscurridos, pendientes, pausar, reanudar, terminar, avanzar } = useTareas();

  // Temporizador de progreso
  useEffect(() => {
    if (estado === 'pausada' || !tareaActiva) return;

    const intervalo = setInterval(() => {
      avanzar(FACTOR_VELOCIDAD_DEMO);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [estado, tareaActiva, avanzar]);

  const manejarAbrirApp = () => {
    // TODO: Llamar al gestor de ventanas
  };

  if (!tareaActiva) {
    // Si no hay tarea, mostramos el estado de logro temporal o vacío
    return (
      <div className="flex h-full w-full flex-col bg-bg">
        <BarraSistema />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted text-xl">Logro: pendiente (No tienes tareas pendientes)</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <BarraSistema />
      <div className="flex flex-1 overflow-hidden">
        <Dock appActiva={tareaActiva.app} onAbrirApp={manejarAbrirApp} />
        
        <main className="flex flex-1 flex-col items-center justify-between p-6 overflow-y-auto">
          {/* Espacio flexible arriba */}
          <div className="flex-1" />
          
          <div aria-live="polite" className="w-full max-w-2xl">
            <TarjetaTareaActiva
              tarea={tareaActiva}
              estado={estado}
              segundosTranscurridos={segundosTranscurridos}
              onPausar={pausar}
              onReanudar={reanudar}
              onTerminar={terminar}
            />
          </div>

          {/* Espacio flexible medio */}
          <div className="flex-[0.5]" />

          <FranjaPendientes pendientes={pendientes} maximo={CUPO_MAXIMO_TAREAS} />
        </main>
      </div>
    </div>
  );
}
