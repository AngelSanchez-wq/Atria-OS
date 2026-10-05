import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

type IframeAppProps = {
  url: string;
  nombreApp: string;
};

export function IframeApp({ url, nombreApp }: IframeAppProps) {
  const [cargando, setCargando] = useState(true);

  const urlCompleta = url.startsWith('http')
    ? url
    : `${import.meta.env.BASE_URL}${url}`;

  return (
    <div className="relative flex h-full w-full flex-col bg-card">
      {cargando && (
        <div
          role="status"
          aria-label={`Cargando ${nombreApp}`}
          className="absolute inset-0 z-10 flex items-center justify-center bg-card text-muted"
        >
          <span className="font-medium text-sm animate-pulse">Cargando…</span>
        </div>
      )}

      <iframe
        src={urlCompleta}
        title={nombreApp}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        onLoad={() => setCargando(false)}
        className="h-full w-full flex-1 border-0"
      />

      <div className="flex h-7 shrink-0 items-center justify-between border-t border-line bg-soft px-3 text-xs text-muted">
        <span>¿No carga?</span>
        <a
          href={urlCompleta}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-semibold text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent outline-none"
        >
          <span>Ábrela en una pestaña nueva</span>
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
