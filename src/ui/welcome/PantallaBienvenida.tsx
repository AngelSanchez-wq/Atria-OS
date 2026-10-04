import { useState } from 'react';
import { useSesion } from '../../store/sesion';
import { TAREAS_SEMILLA } from '../../kernel/tasks/tareas-semilla';
import { siguienteSugerencia } from '../../kernel/tasks/sugerencias';
import { BarraSistema } from '../systembar/BarraSistema';
import { Buho } from '../components/Buho';
import { TarjetaTarea } from '../components/TarjetaTarea';
import { Boton } from '../components/Boton';
import { BotonEnlace } from '../components/BotonEnlace';
import { Tarea } from '../../kernel/types';

type PantallaBienvenidaProps = {
  onEmpezar: (tarea: Tarea) => void;
};

export function PantallaBienvenida({ onEmpezar }: PantallaBienvenidaProps) {
  const usuario = useSesion((s) => s.usuario);
  const [indiceTarea, setIndiceTarea] = useState(0);

  // Fallback de seguridad, aunque 'usuario' siempre debería existir si se monta esta pantalla.
  const nombre = usuario?.nombre || 'Usuario';
  const tareas = TAREAS_SEMILLA;
  const tareaActual = tareas[indiceTarea];

  const handleSiguiente = () => {
    setIndiceTarea((prev) => siguienteSugerencia(tareas, prev));
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <BarraSistema />
      
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="mb-6 text-sm font-bold uppercase tracking-wider text-muted">
          Inicio del día
        </p>
        
        <div className="mb-6">
          <Buho estado="foco" tamano={96} />
        </div>
        
        <h1 className="mb-2 font-fredoka text-4xl font-semibold text-ink">
          Hola, {nombre}
        </h1>
        <p className="mb-10 text-lg text-muted">
          ¿Empezamos con algo pequeño?
        </p>
        
        <div className="mb-8 w-full max-w-[420px]" aria-live="polite">
          <TarjetaTarea tarea={tareaActual} />
        </div>
        
        <div className="mb-4">
          <Boton onClick={() => onEmpezar(tareaActual)}>
            Empezar
          </Boton>
        </div>
        
        <BotonEnlace onClick={handleSiguiente}>
          Otra sugerencia
        </BotonEnlace>
      </main>
    </div>
  );
}
