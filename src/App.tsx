import { useState } from 'react';
import { PantallaEncendido } from './ui/boot/PantallaEncendido';
import { PantallaLogin } from './ui/login/PantallaLogin';
import { PantallaBienvenida } from './ui/welcome/PantallaBienvenida';
import { PantallaEscritorio } from './ui/desktop/PantallaEscritorio';
import { useSesion } from './store/sesion';
import { useTareas } from './store/tareas';
import { TAREAS_SEMILLA } from './kernel/tasks/tareas-semilla';

export default function App() {
  const [encendidoTerminado, setEncendidoTerminado] = useState(false);
  const usuario = useSesion((s) => s.usuario);
  const ingresar = useSesion((s) => s.ingresar);
  const tareaActiva = useTareas((s) => s.tareaActiva);
  const empezarTarea = useTareas((s) => s.empezar);

  if (!encendidoTerminado) {
    return <PantallaEncendido onTerminar={() => setEncendidoTerminado(true)} />;
  }

  if (!usuario) {
    return <PantallaLogin onIngresar={ingresar} />;
  }

  if (!tareaActiva) {
    return (
      <PantallaBienvenida 
        onEmpezar={(tarea) => {
          // Cargamos las demás tareas semilla como pendientes por ahora
          const pendientes = TAREAS_SEMILLA.filter(t => t.id !== tarea.id);
          empezarTarea(tarea, pendientes);
        }} 
      />
    );
  }

  return <PantallaEscritorio />;
}
