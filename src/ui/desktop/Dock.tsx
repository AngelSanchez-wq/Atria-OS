import { APPS } from '../../config/apps';
import { AppId } from '../../kernel/types';
import { useSesion } from '../../store/sesion';
import { IconoApp } from '../components/IconoApp';

type DockProps = {
  appActiva?: AppId;
  appsAbiertas?: AppId[];
  appEnfocada?: AppId | null;
  onAbrirApp: (id: AppId) => void;
};

const TODAS_APPS = Object.keys(APPS) as AppId[];
const APPS_ESTANDAR = TODAS_APPS.filter((id) => !APPS[id].soloAdmin);
const APPS_ADMIN = TODAS_APPS.filter((id) => APPS[id].soloAdmin);

export function Dock({
  appActiva,
  appsAbiertas = [],
  appEnfocada,
  onAbrirApp,
}: DockProps) {
  const usuario = useSesion((s) => s.usuario);
  const esAdmin = usuario?.rol === 'admin';

  const renderBotonApp = (idApp: AppId) => {
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
  };

  return (
    <nav
      aria-label="Aplicaciones"
      className="flex h-full w-20 shrink-0 flex-col items-center gap-6 border-r border-line py-8 select-none"
    >
      <div className="flex flex-col items-center gap-6">
        {APPS_ESTANDAR.map(renderBotonApp)}
      </div>

      {esAdmin && APPS_ADMIN.length > 0 && (
        <>
          <div className="h-px w-8 bg-line" aria-hidden="true" />
          <div className="flex flex-col items-center gap-6">
            {APPS_ADMIN.map(renderBotonApp)}
          </div>
        </>
      )}
    </nav>
  );
}
