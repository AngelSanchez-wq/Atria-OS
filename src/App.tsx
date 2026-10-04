import { useState } from 'react';
import { PantallaEncendido } from './ui/boot/PantallaEncendido';
import { PantallaLogin } from './ui/login/PantallaLogin';
import { PantallaBienvenida } from './ui/welcome/PantallaBienvenida';
import { BarraSistema } from './ui/systembar/BarraSistema';
import { useSesion } from './store/sesion';
import { Tarea } from './kernel/types';

export default function App() {
  const [encendidoTerminado, setEncendidoTerminado] = useState(false);
  const [tareaActiva, setTareaActiva] = useState<Tarea | null>(null);
  const usuario = useSesion((s) => s.usuario);
  const ingresar = useSesion((s) => s.ingresar);

  if (!encendidoTerminado) {
    return <PantallaEncendido onTerminar={() => setEncendidoTerminado(true)} />;
  }

  if (!usuario) {
    return <PantallaLogin onIngresar={ingresar} />;
  }

  if (!tareaActiva) {
    return <PantallaBienvenida onEmpezar={setTareaActiva} />;
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      {/* Marcador temporal: la barra se verá aquí hasta existir el escritorio. */}
      <BarraSistema />
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted">Escritorio: pendiente ({tareaActiva.titulo})</p>
      </main>
    </div>
  );
}
