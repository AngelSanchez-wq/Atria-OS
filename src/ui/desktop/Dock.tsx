import { APPS } from '../../config/apps';
import { AppId } from '../../kernel/types';
import { IconoApp } from '../components/IconoApp';

type DockProps = {
  appActiva?: AppId;
  onAbrirApp: (id: AppId) => void;
};

const TODAS_APPS = Object.keys(APPS) as AppId[];

export function Dock({ appActiva, onAbrirApp }: DockProps) {
  return (
    <nav
      aria-label="Aplicaciones"
      className="flex h-full w-20 shrink-0 flex-col items-center gap-6 border-r border-line py-8"
    >
      {TODAS_APPS.map((idApp) => {
        const esActiva = appActiva === idApp;
        return (
          <button
            key={idApp}
            type="button"
            aria-label={APPS[idApp].nombre}
            title={APPS[idApp].nombre}
            onClick={() => onAbrirApp(idApp)}
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl outline-none transition-all hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent ${
              esActiva ? 'bg-soft' : 'bg-transparent'
            }`}
          >
            <div className={`transition-colors ${esActiva ? 'text-accent' : 'text-muted'}`}>
              <IconoApp app={idApp} size={28} decorativo={true} />
            </div>
            
            {esActiva && (
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
