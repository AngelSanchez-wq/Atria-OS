import { useRef, useEffect } from 'react';
import { DatosVentana } from '../../store/ventanas';
import { APPS } from '../../config/apps';
import { BarraTitulo } from './BarraTitulo';

type VentanaProps = {
  ventana: DatosVentana;
  enfocada: boolean;
  onEnfocar: () => void;
  onMinimizar: () => void;
  onMaximizar: () => void;
  onCerrar: () => void;
  onMover: (x: number, y: number) => void;
  children: React.ReactNode;
};

export function Ventana({
  ventana,
  enfocada,
  onEnfocar,
  onMinimizar,
  onMaximizar,
  onCerrar,
  onMover,
  children,
}: VentanaProps) {
  const info = APPS[ventana.appId];
  const refVentana = useRef<HTMLDivElement>(null);
  const arrastrandoRef = useRef(false);
  const inicioArrastreRef = useRef({ ratonX: 0, ratonY: 0, ventanaX: 0, ventanaY: 0 });

  // // TODO: Implementar arrastre con teclado (Alt + flechas)

  const manejarInicioArrastre = (e: React.PointerEvent) => {
    if (ventana.estado === 'maximizada') return;
    arrastrandoRef.current = true;
    inicioArrastreRef.current = {
      ratonX: e.clientX,
      ratonY: e.clientY,
      ventanaX: ventana.x,
      ventanaY: ventana.y,
    };
    onEnfocar();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const alMover = (e: PointerEvent) => {
      if (!arrastrandoRef.current) return;
      const dx = e.clientX - inicioArrastreRef.current.ratonX;
      const dy = e.clientY - inicioArrastreRef.current.ratonY;

      // Limitar dentro del área visible aproximada
      const nuevoX = Math.max(0, inicioArrastreRef.current.ventanaX + dx);
      const nuevoY = Math.max(0, inicioArrastreRef.current.ventanaY + dy);

      onMover(nuevoX, nuevoY);
    };

    const alSoltar = () => {
      arrastrandoRef.current = false;
    };

    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', alSoltar);
    return () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', alSoltar);
    };
  }, [onMover]);

  const esMinimizada = ventana.estado === 'minimizada';
  const esMaximizada = ventana.estado === 'maximizada';

  return (
    <div
      ref={refVentana}
      role="dialog"
      aria-label={info.nombre}
      onPointerDown={onEnfocar}
      className={`absolute flex flex-col overflow-hidden bg-card shadow-lg transition-shadow duration-150 ${
        esMinimizada ? 'hidden' : ''
      } ${
        esMaximizada
          ? 'inset-0 h-full w-full rounded-none border-0'
          : `rounded-2xl ${enfocada ? 'border-2 border-accent' : 'border border-line'}`
      }`}
      style={
        esMaximizada
          ? { zIndex: ventana.ordenFoco }
          : {
              left: `${ventana.x}px`,
              top: `${ventana.y}px`,
              width: `${ventana.ancho}px`,
              height: `${ventana.alto}px`,
              zIndex: ventana.ordenFoco,
            }
      }
    >
      <BarraTitulo
        appId={ventana.appId}
        maximizada={esMaximizada}
        onMinimizar={onMinimizar}
        onMaximizar={onMaximizar}
        onCerrar={onCerrar}
        onPointerDown={manejarInicioArrastre}
      />

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
