import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Crop } from 'lucide-react';
import { Boton } from '../../ui/components/Boton';
import { VistaPreviaFoto } from '../../platform/types';
import { calcularRecorte } from '../../kernel/users/foto';

type DialogoAjustarFotoProps = {
  abierto: boolean;
  archivo: File;
  vistaPrevia: VistaPreviaFoto;
  onGuardar: (dataUrl: string) => Promise<void>;
  onCancelar: () => void;
  procesarImagen: (archivo: File, recorte: { x: number; y: number; lado: number }) => Promise<string>;
};

export function DialogoAjustarFoto(props: DialogoAjustarFotoProps) {
  if (!props.abierto) return null;

  return <DialogoAjustarFotoModal key={props.vistaPrevia.url} {...props} />;
}

function DialogoAjustarFotoModal({
  archivo,
  vistaPrevia,
  onGuardar,
  onCancelar,
  procesarImagen,
}: Omit<DialogoAjustarFotoProps, 'abierto'>) {
  const [zoom, setZoom] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCancelarRef = useRef(onCancelar);
  useEffect(() => {
    onCancelarRef.current = onCancelar;
  }, [onCancelar]);

  // Al desmontar o cancelar, liberar el URL de la vista previa para no dejar fugas de memoria
  useEffect(() => {
    return () => {
      vistaPrevia.liberar();
    };
  }, [vistaPrevia]);

  const sliderRef = useRef<HTMLInputElement>(null);
  const botonCancelarRef = useRef<HTMLButtonElement>(null);
  const botonGuardarRef = useRef<HTMLButtonElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en el zoom slider ejecutado UNA SOLA VEZ al montar el diálogo
  useEffect(() => {
    sliderRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelarRef.current();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, []); // Dependencias vacías: los re-renders periódicos del sistema no mueven el foco

  const manejarTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const candidatos: (HTMLElement | null)[] = [
      botonCerrarRef.current,
      sliderRef.current,
      botonCancelarRef.current,
      botonGuardarRef.current,
    ];
    const elementos = candidatos.filter(
      (el): el is HTMLElement => el !== null && !el.hasAttribute('disabled')
    );
    if (elementos.length === 0) return;

    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    if (!primero || !ultimo) return;

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

  const manejarGuardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      const recorte = calcularRecorte(vistaPrevia.ancho, vistaPrevia.alto, zoom);
      const dataUrl = await procesarImagen(archivo, recorte);
      await onGuardar(dataUrl);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra o ajusta el zoom.');
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 select-none"
      onClick={() => onCancelarRef.current()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-ajustar-foto-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTeclado}
        className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-line bg-card p-6 shadow-xl"
      >
        {/* Cabecera del diálogo */}
        <div className="flex items-center justify-between">
          <h2
            id="dialogo-ajustar-foto-titulo"
            className="font-fredoka text-xl font-semibold text-ink"
          >
            Ajusta tu foto
          </h2>
          <button
            ref={botonCerrarRef}
            type="button"
            aria-label="Cerrar diálogo"
            disabled={guardando}
            onClick={() => onCancelarRef.current()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Vista previa de 240 px con máscara circular */}
        <div className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center overflow-hidden rounded-3xl border border-line bg-card/60 shadow-inner">
          <img
            src={vistaPrevia.url}
            alt="Vista previa de recorte"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out motion-reduce:transition-none"
          />

          {/* Máscara circular translúcida para previsualizar el recorte final */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="h-[216px] w-[216px] rounded-full border-2 border-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </div>

        {/* Control de zoom */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">Zoom</span>
            <span className="font-bold text-muted">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <Crop size={16} className="text-muted shrink-0" aria-hidden="true" />
            <input
              ref={sliderRef}
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={guardando}
              aria-label="Zoom"
              className="flex-1 accent-accent h-1.5 bg-line rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <ImageIcon size={18} className="text-muted shrink-0" aria-hidden="true" />
          </div>

          <p className="text-xs text-muted text-center">
            Se recortará desde el centro.
          </p>
        </div>

        {/* Mensaje de error sereno */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-warm px-3.5 py-2 text-xs font-medium text-warm-ink border border-warm-line text-center shadow-2xs"
          >
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Boton
            ref={botonCancelarRef}
            variante="secundario"
            deshabilitado={guardando}
            onClick={() => onCancelarRef.current()}
          >
            Cancelar
          </Boton>
          <Boton
            ref={botonGuardarRef}
            variante="principal"
            deshabilitado={guardando}
            onClick={manejarGuardar}
          >
            {guardando ? 'Guardando…' : 'Guardar foto'}
          </Boton>
        </div>
      </div>
    </div>
  );
}
