import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Boton } from '../components/Boton';
import { Interruptor } from '../components/Interruptor';
import { IdApp, LimitesUsuario, Usuario } from '../../kernel/types';
import { APPS } from '../../config/apps';
import {
  MAX_MEMORIA_USUARIO_MB,
  MAX_TAREAS_ACTIVAS,
  MIN_MEMORIA_USUARIO_MB,
  MIN_TAREAS_ACTIVAS,
} from '../../kernel/users/constantes';

type PanelEditarLimitesProps = {
  usuario: Usuario | null;
  onGuardar: (
    usuarioId: string,
    nuevosLimites: Partial<LimitesUsuario>
  ) => { ok: boolean; motivo?: string };
  onCerrar: () => void;
};

// Apps configurables por perfil
const APPS_CONFIGURABLES: IdApp[] = [
  'focuspad',
  'timelapse',
  'burble',
  'tagfs',
  'ambient',
];

export function PanelEditarLimites({
  usuario,
  onGuardar,
  onCerrar,
}: PanelEditarLimitesProps) {
  if (!usuario) return null;

  return (
    <PanelEditarLimitesContenido
      key={usuario.id}
      usuario={usuario}
      onGuardar={onGuardar}
      onCerrar={onCerrar}
    />
  );
}

function PanelEditarLimitesContenido({
  usuario,
  onGuardar,
  onCerrar,
}: {
  usuario: Usuario;
  onGuardar: (
    usuarioId: string,
    nuevosLimites: Partial<LimitesUsuario>
  ) => { ok: boolean; motivo?: string };
  onCerrar: () => void;
}) {
  const [appsHabilitadas, setAppsHabilitadas] = useState<IdApp[]>(
    () => usuario.limites.appsHabilitadas ?? []
  );
  const [maxTareas, setMaxTareas] = useState(
    () => usuario.limites.maxTareasActivas ?? 3
  );
  const [memoriaMb, setMemoriaMb] = useState(
    () => usuario.limites.memoriaMaximaMb ?? 1024
  );
  const [error, setError] = useState<string | null>(null);

  const alternarApp = (idApp: IdApp, habilitar: boolean) => {
    if (habilitar) {
      if (!appsHabilitadas.includes(idApp)) {
        setAppsHabilitadas([...appsHabilitadas, idApp]);
      }
    } else {
      setAppsHabilitadas(appsHabilitadas.filter((id) => id !== idApp));
    }
  };

  const decrementarTareas = () => {
    if (maxTareas > MIN_TAREAS_ACTIVAS) {
      setMaxTareas(maxTareas - 1);
    }
  };

  const incrementarTareas = () => {
    if (maxTareas < MAX_TAREAS_ACTIVAS) {
      setMaxTareas(maxTareas + 1);
    }
  };

  const manejarGuardar = () => {
    setError(null);
    const res = onGuardar(usuario.id, {
      appsHabilitadas,
      maxTareasActivas: maxTareas,
      memoriaMaximaMb: memoriaMb,
    });

    if (!res.ok) {
      setError(res.motivo ?? 'No se pudieron actualizar los límites.');
      return;
    }

    onCerrar();
  };

  return (
    <aside
      aria-label={`Límites de ${usuario.nombre}`}
      className="absolute top-0 right-0 z-20 flex h-full w-full max-w-sm flex-col justify-between border-l border-line bg-card p-6 shadow-xl"
    >
      <div className="flex flex-col gap-6 overflow-y-auto">
        {/* Cabecera del panel */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-sm font-bold text-accent-strong"
              aria-hidden="true"
            >
              {usuario.inicial}
            </span>
            <h3 className="font-fredoka text-lg font-semibold text-ink">
              Límites de {usuario.nombre}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Cerrar panel de límites"
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sección: Apps Habilitadas */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Apps Habilitadas
          </span>
          <div className="flex flex-col gap-2.5">
            {APPS_CONFIGURABLES.map((idApp) => {
              const info = APPS[idApp];
              const estaHabilitada = appsHabilitadas.includes(idApp);
              return (
                <div
                  key={idApp}
                  className="flex items-center justify-between rounded-xl px-2 py-1 transition-colors hover:bg-soft/30"
                >
                  <span className="text-sm font-medium text-ink">
                    {info?.nombre ?? idApp}
                  </span>
                  <Interruptor
                    activo={estaHabilitada}
                    onAlternar={(nuevo) => alternarApp(idApp, nuevo)}
                    ariaLabel={`Habilitar ${info?.nombre ?? idApp}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Tareas Activas */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Tareas Activas
          </span>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-soft/30 p-3">
            <span className="text-sm font-medium text-ink">
              Límite simultáneo
            </span>
            <div
              className="flex items-center gap-3"
              role="group"
              aria-label="Selector de límite simultáneo de tareas"
            >
              <button
                type="button"
                aria-label="Reducir tareas"
                disabled={maxTareas <= MIN_TAREAS_ACTIVAS}
                onClick={decrementarTareas}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink disabled:opacity-40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronLeft size={16} />
              </button>
              <span
                role="spinbutton"
                aria-valuenow={maxTareas}
                aria-valuemin={MIN_TAREAS_ACTIVAS}
                aria-valuemax={MAX_TAREAS_ACTIVAS}
                aria-label="Tareas activas simultáneas"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    decrementarTareas();
                  } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    incrementarTareas();
                  }
                }}
                className="w-4 text-center font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xs"
              >
                {maxTareas}
              </span>
              <button
                type="button"
                aria-label="Aumentar tareas"
                disabled={maxTareas >= MAX_TAREAS_ACTIVAS}
                onClick={incrementarTareas}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink disabled:opacity-40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sección: Memoria Máxima */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Memoria Máxima
            </span>
            <span className="text-xs font-bold text-ink">
              {memoriaMb} de {MAX_MEMORIA_USUARIO_MB} MB
            </span>
          </div>
          <input
            type="range"
            min={MIN_MEMORIA_USUARIO_MB}
            max={MAX_MEMORIA_USUARIO_MB}
            step={64}
            value={memoriaMb}
            onChange={(e) => setMemoriaMb(Number(e.target.value))}
            aria-label="Control deslizante de memoria máxima"
            className="w-full accent-accent cursor-pointer"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-warm-ink">
            {error}
          </p>
        )}
      </div>

      {/* Pie del panel con ayuda y botones */}
      <div className="flex flex-col gap-4 border-t border-line pt-4">
        <p className="text-xs text-muted">
          Los cambios se aplican en la próxima acción del usuario.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Boton
            type="button"
            variante="secundario"
            onClick={onCerrar}
            className="!px-5 !py-2 text-sm"
          >
            Cancelar
          </Boton>
          <Boton
            type="button"
            variante="principal"
            onClick={manejarGuardar}
            className="!px-5 !py-2 text-sm"
          >
            Guardar
          </Boton>
        </div>
      </div>
    </aside>
  );
}
