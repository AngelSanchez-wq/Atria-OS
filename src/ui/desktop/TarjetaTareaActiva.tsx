import { Tarea } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { IconoApp } from '../components/IconoApp';
import { BarraProgreso } from '../components/BarraProgreso';
import { Boton } from '../components/Boton';
import { formatearTiempo } from '../../kernel/tasks/tiempo';
import { calcularPorcentaje, obtenerColorProgreso } from '../../kernel/tasks/progreso';
import { EstadoTarea } from '../../store/tareas';

type TarjetaTareaActivaProps = {
  tarea: Tarea;
  estado: EstadoTarea;
  segundosTranscurridos: number;
  onPausar: () => void;
  onReanudar: () => void;
  onTerminar: () => void;
};

export function TarjetaTareaActiva({
  tarea,
  estado,
  segundosTranscurridos,
  onPausar,
  onReanudar,
  onTerminar,
}: TarjetaTareaActivaProps) {
  const nombreApp = APPS[tarea.app].nombre;
  const porcentaje = calcularPorcentaje(segundosTranscurridos, tarea.minutos);
  const colorBarra = obtenerColorProgreso(porcentaje);
  
  const transcurrido = formatearTiempo(segundosTranscurridos);
  const total = formatearTiempo(tarea.minutos * 60);
  const textoEstado = estado === 'pausada' ? 'En pausa' : 'En curso';

  return (
    <article
      aria-label={`Tarea actual: ${tarea.titulo}`}
      className="flex w-full max-w-2xl flex-col gap-8 rounded-3xl border-2 border-accent bg-card p-10 shadow-sm"
    >
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-soft text-accent">
          <IconoApp app={tarea.app} size={40} decorativo={true} />
        </div>
        
        <div className="flex flex-col">
          <h2 className="font-fredoka text-3xl font-semibold text-ink">
            {tarea.titulo}
          </h2>
          <p className="mt-1 text-lg text-muted">
            {nombreApp} &middot; {textoEstado} &middot; {transcurrido} de {total} &middot; #{tarea.etiqueta}
          </p>
        </div>
      </div>

      <BarraProgreso
        valor={porcentaje}
        color={colorBarra}
        etiqueta={`Progreso de la tarea: ${Math.round(porcentaje)}%`}
        className="w-full h-2"
      />

      <div className="flex items-center justify-end gap-4">
        {estado === 'pausada' ? (
          <Boton variante="secundario" onClick={onReanudar}>
            Reanudar
          </Boton>
        ) : (
          <Boton variante="secundario" onClick={onPausar}>
            Pausar
          </Boton>
        )}
        <Boton variante="principal" onClick={onTerminar}>
          Terminar
        </Boton>
      </div>
    </article>
  );
}
