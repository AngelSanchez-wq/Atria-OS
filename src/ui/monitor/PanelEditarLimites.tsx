import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Boton } from '../components/Boton';
import { Avatar } from '../components/Avatar';
import { Dialogo } from '../components/Dialogo';
import { Interruptor } from '../components/Interruptor';
import { IdApp, LimitesUsuario, Usuario } from '../../kernel/types';
import { APPS } from '../../config/apps';
import {
  MAX_MEMORIA_USUARIO_MB,
  MAX_TAREAS_ACTIVAS,
  MIN_MEMORIA_USUARIO_MB,
  MIN_TAREAS_ACTIVAS,
} from '../../kernel/users/constantes';
import { useUsuariosStore } from '../../store/usuarios';
import { useSesion } from '../../store/sesion';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

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
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const quitarFotoStore = useUsuariosStore((s) => s.quitarFoto);
  const usuarioSesion = useSesion((s) => s.usuario);
  const actor = usuarioSesion ?? usuarios.find((u) => u.rol === 'admin') ?? USUARIOS_SEMILLA[2];

  // Mantener actualizado el usuario si se modifica su foto en el store
  const usuarioActual = usuarios.find((u) => u.id === usuario.id) ?? usuario;

  const [dialogoQuitarFoto, setDialogoQuitarFoto] = useState(false);
  const [appsHabilitadas, setAppsHabilitadas] = useState<IdApp[]>(
    () => usuarioActual.limites.appsHabilitadas ?? []
  );
  const [maxTareas, setMaxTareas] = useState(
    () => usuarioActual.limites.maxTareasActivas ?? 3
  );
  const [memoriaMb, setMemoriaMb] = useState(
    () => usuarioActual.limites.memoriaMaximaMb ?? 1024
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
    const res = onGuardar(usuarioActual.id, {
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
      aria-label={`Límites de ${usuarioActual.nombre}`}
      className="absolute top-0 right-0 z-20 flex h-full w-full max-w-sm flex-col justify-between border-l border-line bg-card p-6 shadow-xl"
    >
      <div className="flex flex-col gap-6 overflow-y-auto">
        {/* Cabecera del panel */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-fredoka text-lg font-semibold text-ink">
              Editar a {usuarioActual.nombre}
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

        {/* Sección: Avatar y Foto del usuario */}
        <div className="flex flex-col items-center gap-2.5 py-1 text-center">
          <Avatar
            nombre={usuarioActual.nombre}
            inicial={usuarioActual.inicial}
            esAdmin={usuarioActual.rol === 'admin'}
            foto={usuarioActual.foto}
            tamanoPx={80}
            mostrarNombre={false}
          />

          {usuarioActual.foto && (
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setDialogoQuitarFoto(true)}
              className="flex items-center gap-2 !px-3 !py-1 text-xs"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Quitar foto</span>
            </Boton>
          )}

          <p className="text-xs text-muted max-w-[220px]">
            Solo la persona usuaria puede cambiar su foto.
          </p>
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
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-ink transition-colors hover:bg-soft disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-4 text-center font-bold text-ink">
                {maxTareas}
              </span>
              <button
                type="button"
                aria-label="Aumentar tareas"
                disabled={maxTareas >= MAX_TAREAS_ACTIVAS}
                onClick={incrementarTareas}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-ink transition-colors hover:bg-soft disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sección: Memoria Máxima (MB) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Memoria Máxima
            </span>
            <span className="text-xs font-bold text-accent-strong">
              {memoriaMb} MB
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

      {/* Diálogo de confirmación para que el admin quite la foto */}
      <Dialogo
        abierto={dialogoQuitarFoto}
        titulo={`¿Quitar foto de ${usuarioActual.nombre}?`}
        mensaje="Se restablecerán las iniciales del usuario como imagen de perfil."
        textoConfirmar="Quitar foto"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          quitarFotoStore(actor, usuarioActual.id);
          setDialogoQuitarFoto(false);
        }}
        onCancelar={() => setDialogoQuitarFoto(false)}
      />
    </aside>
  );
}
