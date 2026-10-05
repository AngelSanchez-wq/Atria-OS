import { APPS } from '../../config/apps';
import { AppId } from '../../kernel/types';
import { IconoApp } from '../components/IconoApp';

type DockProps = {
  appActiva?: AppId;
  appsAbiertas?: AppId[];
  appEnfocada?: AppId | null;
  onAbrirApp: (id: AppId) => void;
};

const TODAS_APPS = Object.keys(APPS) as AppId[];

export function Dock({
  appActiva,
  appsAbiertas = [],
  appEnfocada,
  onAbrirApp,
}: DockProps) {
  return (
    <nav
      aria-label="Aplicaciones"
      className="flex h-full w-20 shrink-0 flex-col items-center gap-6 border-r border-line py-8 select-none"
    >
      {TODAS_APPS.map((idApp) => {
        const estaAbierta = appsAbiertas.includes(idApp);
        const estaEnfocada = appEnfocada === idApp;
        const nombre = APPS[idApp].nombre;
        const etiquetaAria = estaAbierta ? `${nombre}, abierta` : nombre;

        return (
          <button
            key={idApp}
            type="button"
            aria-label={etiquetaAria}
            title={nombre}
            onClick={() => onAbrirApp(idApp)}
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl outline-none transition-all hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent ${
              estaEnfocada || (appActiva === idApp && !appEnfocada)
                ? 'bg-soft'
                : 'bg-transparent'
            }`}
          >
            <div
              className={`transition-colors ${
                estaEnfocada || (appActiva === idApp && !appEnfocada)
                  ? 'text-accent'
                  : 'text-muted'
              }`}
            >
              <IconoApp app={idApp} size={28} decorativo={true} />
            </div>

            {estaAbierta && (
              <span
                className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
