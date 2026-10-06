import { useEffect, useRef } from 'react';
import { Boton } from './Boton';

type DialogoProps = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function Dialogo({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Terminar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}: DialogoProps) {
  const botonCancelarRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    // Foco automático en el botón de cancelar para prevenir confirmaciones accidentales
    botonCancelarRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelar();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 select-none"
      onClick={onCancelar}
    >
      <div
        ref={dialogoRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensaje"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-line bg-card p-6 shadow-xl"
      >
        <div className="flex flex-col gap-2">
          <h2 id="dialogo-titulo" className="font-fredoka text-xl font-semibold text-ink">
            {titulo}
          </h2>
          <p id="dialogo-mensaje" className="text-sm text-muted">
            {mensaje}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Boton
            ref={botonCancelarRef}
            variante="secundario"
            onClick={onCancelar}
            className="!px-6 !py-2 text-sm"
          >
            {textoCancelar}
          </Boton>
          <Boton
            variante="principal"
            onClick={onConfirmar}
            className="!px-6 !py-2 text-sm"
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
