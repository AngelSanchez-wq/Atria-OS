import { useState } from 'react';
import { PantallaEncendido } from './ui/boot/PantallaEncendido';

export default function App() {
  const [encendidoTerminado, setEncendidoTerminado] = useState(false);

  if (!encendidoTerminado) {
    return <PantallaEncendido onTerminar={() => setEncendidoTerminado(true)} />;
  }

  return (
    <main className="flex h-full w-full items-center justify-center bg-bg">
      <p className="text-muted">Pantalla de inicio de sesión</p>
    </main>
  );
}
