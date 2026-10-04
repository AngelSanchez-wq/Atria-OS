import { useState } from 'react';
import { PantallaEncendido } from './ui/boot/PantallaEncendido';
import { PantallaLogin } from './ui/login/PantallaLogin';
import { useSesion } from './store/sesion';

export default function App() {
  const [encendidoTerminado, setEncendidoTerminado] = useState(false);
  const usuario = useSesion((s) => s.usuario);
  const ingresar = useSesion((s) => s.ingresar);

  if (!encendidoTerminado) {
    return <PantallaEncendido onTerminar={() => setEncendidoTerminado(true)} />;
  }

  if (!usuario) {
    return <PantallaLogin onIngresar={ingresar} />;
  }

  return (
    <main className="flex h-full w-full items-center justify-center bg-bg">
      <p className="text-muted">Hola, {usuario.nombre}</p>
    </main>
  );
}
