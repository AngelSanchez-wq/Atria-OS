import { ReactNode } from 'react';

type TarjetaResumenProps = {
  titulo: string;
  valorPrincipal?: string | number;
  subtitulo?: string;
  children?: ReactNode;
};

export function TarjetaResumen({
  titulo,
  valorPrincipal,
  subtitulo,
  children,
}: TarjetaResumenProps) {
  return (
    <div className="flex flex-1 flex-col justify-between rounded-2xl border border-line bg-card p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {titulo}
        </span>
        {subtitulo && (
          <span className="text-xs font-semibold text-muted">
            {subtitulo}
          </span>
        )}
      </div>

      {valorPrincipal !== undefined && (
        <div className="mt-2 font-fredoka text-3xl font-semibold text-ink">
          {valorPrincipal}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
