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

export function Dialogo(props: DialogoProps) {
  if (!props.abierto) return null;

  return <DialogoModal key="dialogo-alerta-activo" {...props} />;
}

function DialogoModal({
  titulo,
  mensaje,
  textoConfirmar = 'Terminar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}: Omit<DialogoProps, 'abierto'>) {
  const onCancelarRef = useRef(onCancelar);
  const onConfirmarRef = useRef(onConfirmar);

  useEffect(() => {
    onCancelarRef.current = onCancelar;
    onConfirmarRef.current = onConfirmar;
  }, [onCancelar, onConfirmar]);

  const botonCancelarRef = useRef<HTMLButtonElement>(null);
  const botonConfirmarRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Foco automático en el botón de cancelar UNA SOLA VEZ al abrir para prevenir confirmaciones accidentales
    botonCancelarRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelarRef.current();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, []); // Dependencias vacías: no se vuelve a ejecutar con re-renders del padre

  const manejarTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const elementos = [botonCancelarRef.current, botonConfirmarRef.current].filter(
      (el): el is HTMLButtonElement => el !== null && !el.hasAttribute('disabled')
    );
    if (elementos.length === 0) return;

    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      }
    } else {
      if (document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 select-none"
      onClick={() => onCancelarRef.current()}
    >
      <div
        ref={dialogoRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensaje"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTeclado}
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
            onClick={() => onCancelarRef.current()}
            className="!px-6 !py-2 text-sm"
          >
            {textoCancelar}
          </Boton>
          <Boton
            ref={botonConfirmarRef}
            variante="principal"
            onClick={() => onConfirmarRef.current()}
            className="!px-6 !py-2 text-sm"
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
