import { useMemo, useState } from 'react';
import { useSesion } from '../../store/sesion';
import { useEnergia } from '../../store/energia';
import { useProcesos } from '../../store/procesos';
import { useNotificaciones, seleccionarSinLeer } from '../../store/notificaciones';
import { useTareas, seleccionarSugerenciaActual } from '../../store/tareas';
import { useUsuariosStore } from '../../store/usuarios';
import { pausarProcesosPorSuspension } from '../../kernel/power/transiciones';
import { type DatosTarea } from '../../kernel/tasks/operaciones';
import { BarraSistema } from '../systembar/BarraSistema';
import { Buho } from '../components/Buho';
import { TarjetaTarea } from '../components/TarjetaTarea';
import { Boton } from '../components/Boton';
import { BotonEnlace } from '../components/BotonEnlace';
import { DialogoTarea } from '../tasks/DialogoTarea';
import { DialogoMisTareas } from '../tasks/DialogoMisTareas';
import { Tarea } from '../../kernel/types';
import { registrar } from '../../system/logging/servicio';

type PantallaBienvenidaProps = {
  onEmpezar: (tarea: Tarea) => void;
  onCambiarUsuario?: () => void;
  onCerrarSesion?: () => void;
};

export function PantallaBienvenida({
  onEmpezar,
  onCambiarUsuario,
  onCerrarSesion,
}: PantallaBienvenidaProps) {
  const usuario = useSesion((s) => s.usuario);
  const { procesos } = useProcesos();
  const {
    transicionar,
    solicitarApagar,
    solicitarReiniciar,
    guardarEstadosPrevios,
  } = useEnergia();

  const notificacionesSinLeer = useNotificaciones(seleccionarSinLeer);

  // Datos frescos del usuario (por si el administrador cambió sus apps habilitadas)
  const usuarioActualizado = useUsuariosStore((s) =>
    s.usuarios.find((u) => u.id === usuario?.id)
  );
  const usuarioVigente = usuarioActualizado ?? usuario;

  const tareasPorUsuario = useTareas((s) => s.tareasPorUsuario);
  const sugerenciaActualId = useTareas((s) => s.sugerenciaActualId);
  const otraSugerencia = useTareas((s) => s.otraSugerencia);
  const crear = useTareas((s) => s.crear);

  const [abiertoNueva, setAbiertoNueva] = useState(false);
  const [abiertoMisTareas, setAbiertoMisTareas] = useState(false);
  const [anuncio, setAnuncio] = useState('');

  const sugerencia = useMemo(
    () =>
      usuarioVigente
        ? seleccionarSugerenciaActual({ tareasPorUsuario, sugerenciaActualId }, usuarioVigente)
        : { tarea: null, esImportante: false },
    [usuarioVigente, tareasPorUsuario, sugerenciaActualId]
  );

  const tareaActual = sugerencia.tarea;
  const esImportante = sugerencia.esImportante;
  const nombre = usuario?.nombre || 'Usuario';

  const handleSiguiente = () => {
    otraSugerencia();
  };

  const manejarCrear = (datos: DatosTarea) => {
    const res = crear(datos);
    if (res.ok) {
      setAbiertoNueva(false);
      setAnuncio('Tarea guardada');
    }
    return res;
  };

  const manejarBloquear = () => {
    registrar({
      categoria: 'energia',
      gravedad: 'info',
      mensaje: 'Sistema bloqueado',
      usuarioId: usuario?.id,
    });
    transicionar('bloqueado');
  };

  const manejarSuspender = () => {
    registrar({
      categoria: 'energia',
      gravedad: 'info',
      mensaje: 'Sistema suspendido',
      usuarioId: usuario?.id,
    });
    const { procesosPausados, estadosPrevios } = pausarProcesosPorSuspension(procesos);
    guardarEstadosPrevios(estadosPrevios);
    useProcesos.setState({ procesos: procesosPausados });
    transicionar('suspendido');
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <BarraSistema
        notificaciones={notificacionesSinLeer}
        onBloquear={manejarBloquear}
        onSuspender={manejarSuspender}
        onReiniciar={solicitarReiniciar}
        onApagar={solicitarApagar}
        onCambiarUsuario={onCambiarUsuario}
        onCerrarSesion={onCerrarSesion}
      />

      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>

      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="mb-6 text-sm font-bold uppercase tracking-wider text-muted">
          Inicio del día
        </p>

        <div className="mb-6">
          <Buho estado="foco" tamano={96} />
        </div>

        <h1 className="mb-2 font-fredoka text-4xl font-semibold text-ink">
          Hola, {nombre}
        </h1>
        <p className="mb-10 text-lg text-muted">
          ¿Empezamos con algo pequeño?
        </p>

        {tareaActual ? (
          <>
            <div className="mb-8 w-full max-w-[420px]" aria-live="polite">
              <TarjetaTarea tarea={tareaActual} />
            </div>

            <div className="mb-4">
              <Boton onClick={() => onEmpezar(tareaActual)}>
                Empezar
              </Boton>
            </div>

            {esImportante ? (
              <p className="mb-3 text-sm text-muted">
                Esta tarea es importante hoy.
              </p>
            ) : (
              <div className="mb-3">
                <BotonEnlace onClick={handleSiguiente}>
                  Otra sugerencia
                </BotonEnlace>
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 flex flex-col items-center gap-5" aria-live="polite">
            <p className="text-lg text-muted">
              Aún no tienes tareas.
            </p>
            {usuarioVigente && (
              <Boton onClick={() => setAbiertoNueva(true)}>
                Crear mi primera tarea
              </Boton>
            )}
          </div>
        )}

        {usuarioVigente && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            <BotonEnlace onClick={() => setAbiertoNueva(true)}>
              Nueva tarea
            </BotonEnlace>
            <span className="text-muted" aria-hidden="true">
              &middot;
            </span>
            <BotonEnlace onClick={() => setAbiertoMisTareas(true)}>
              Mis tareas
            </BotonEnlace>
          </div>
        )}
      </main>

      {usuarioVigente && (
        <>
          <DialogoTarea
            abierto={abiertoNueva}
            usuario={usuarioVigente}
            onGuardar={manejarCrear}
            onCancelar={() => setAbiertoNueva(false)}
          />

          <DialogoMisTareas
            abierto={abiertoMisTareas}
            usuario={usuarioVigente}
            onCerrar={() => setAbiertoMisTareas(false)}
            onEmpezar={onEmpezar}
          />
        </>
      )}
    </div>
  );
}
