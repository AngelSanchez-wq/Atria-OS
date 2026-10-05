import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { IconoApp } from '../components/IconoApp';

type MarcadorAppProps = {
  appId: AppId;
};

export function MarcadorApp({ appId }: MarcadorAppProps) {
  const info = APPS[appId];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-card p-8 text-center select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-soft text-accent">
        <IconoApp app={appId} size={36} decorativo={true} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-fredoka text-xl font-semibold text-ink">
          {info.nombre}
        </h3>
        <p className="text-sm text-muted">
          Esta app está en construcción
        </p>
      </div>
    </div>
  );
}
