import { SONIDOS_AMBIENT, SonidoId } from './sonidos';
import { alternarSonido } from './logica';
import { BotonSonido } from './BotonSonido';
import { ControlVolumen } from './ControlVolumen';
import { useAudioStore } from '../../store/audio';
import { servicioAudio } from '../../system/audio/servicio';

export const TITULO_AMBIENT = 'Sonido de fondo';
export const SUBTITULO_AMBIENT = 'Elige uno. Sigue sonando mientras trabajas.';
export const TEXTO_EN_SILENCIO = 'En silencio';

export function Ambient() {
  const { sonidoActivo, volumen, aviso } = useAudioStore();

  const manejarPulsarSonido = (id: SonidoId) => {
    const siguiente = alternarSonido(sonidoActivo, id);
    if (siguiente === null) {
      servicioAudio.detener();
    } else {
      servicioAudio.reproducir(siguiente);
    }
  };

  const manejarCambiarVolumen = (nuevoVolumen: number) => {
    servicioAudio.establecerVolumen(nuevoVolumen);
  };

  const sonidoActualInfo = SONIDOS_AMBIENT.find((s) => s.id === sonidoActivo);
  const textoEstado = sonidoActualInfo
    ? `Sonando: ${sonidoActualInfo.nombre}`
    : TEXTO_EN_SILENCIO;

  return (
    <div
      role="region"
      aria-label="Reproductor de sonido de fondo Ambient"
      className="flex h-full w-full flex-col justify-between bg-card p-6 select-none overflow-y-auto"
    >
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <h2 className="font-fredoka text-xl font-semibold text-ink">
          {TITULO_AMBIENT}
        </h2>
        <p className="text-sm text-muted">{SUBTITULO_AMBIENT}</p>
      </div>

      {/* Cuadrícula 2x2 de sonidos */}
      <div className="grid grid-cols-2 gap-4 my-4">
        {SONIDOS_AMBIENT.map((sonido) => {
          const estaActivo = sonidoActivo === sonido.id;
          return (
            <BotonSonido
              key={sonido.id}
              sonido={sonido}
              activo={estaActivo}
              onClick={() => manejarPulsarSonido(sonido.id)}
            />
          );
        })}
      </div>

      {/* Control de volumen */}
      <div className="flex flex-col gap-4">
        <ControlVolumen
          volumen={volumen}
          onCambiarVolumen={manejarCambiarVolumen}
        />

        {/* Pie con estado sonoro accesible */}
        <div
          aria-live="polite"
          className="flex items-center justify-center gap-2 text-xs font-semibold text-muted"
        >
          {sonidoActualInfo && (
            <span
              className="h-2 w-2 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
          <span>{aviso ?? textoEstado}</span>
        </div>
      </div>
    </div>
  );
}
