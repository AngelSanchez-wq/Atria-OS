import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { Boton } from '../components/Boton';
import { APPS } from '../../config/apps';
import { AppId } from '../../kernel/types';
import { RechazoAperturaApp } from '../../store/ventanas';

type DialogoRechazoAppProps = {
  rechazo: RechazoAperturaApp | null;
  onCerrar: () => void;
};

/**
 * Diálogo modal tranquilo para informar que una app no está disponible
 * para el perfil actual o que no hay memoria suficiente asignada.
 * Basado en el mockup: círculo amarillo pastel con candado, sin colores rojos.
 */
export function DialogoRechazoApp({ rechazo, onCerrar }: DialogoRechazoAppProps) {
  if (!rechazo) return null;

  return <DialogoRechazoAppModal key="dialogo-rechazo-activo" rechazo={rechazo} onCerrar={onCerrar} />;
}

function DialogoRechazoAppModal({
  rechazo,
  onCerrar,
}: {
  rechazo: RechazoAperturaApp;
  onCerrar: () => void;
}) {
  const onCerrarRef = useRef(onCerrar);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botonRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrarRef.current();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, []);

  const nombreApp = APPS[rechazo.idApp as AppId]?.nombre ?? rechazo.idApp;

  const esPorMemoria = rechazo.motivo === 'memoria-insuficiente';

  const titulo = esPorMemoria
    ? 'No hay memoria disponible para tu perfil'
    : `${nombreApp} no está disponible`;

  const descripcion = esPorMemoria
    ? 'Cierra una app para abrir otra.'
    : 'El administrador la desactivó para tu perfil.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4 select-none"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-rechazo-titulo"
        aria-describedby="dialogo-rechazo-desc"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-line bg-card p-8 shadow-xl text-center"
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-warm text-warm-ink"
          aria-hidden="true"
        >
          <Lock className="h-7 w-7 stroke-[2.2]" />
        </div>

        <div className="flex flex-col gap-2">
          <h2
            id="dialogo-rechazo-titulo"
            className="font-fredoka text-xl font-semibold text-ink"
          >
            {titulo}
          </h2>
          <p id="dialogo-rechazo-desc" className="text-sm text-muted">
            {descripcion}
          </p>
        </div>

        <div className="w-full pt-2">
          <Boton
            ref={botonRef}
            variante="principal"
            onClick={onCerrar}
            className="w-full justify-center !py-2.5 text-sm"
          >
            Entendido
          </Boton>
        </div>
      </div>
    </div>
  );
}
