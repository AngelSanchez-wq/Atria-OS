import { PreferenciaTema } from '../../platform/types';
import { useTema } from '../../store/tema';

const OPCIONES: { id: PreferenciaTema; etiqueta: string }[] = [
  { id: 'claro', etiqueta: 'Claro' },
  { id: 'oscuro', etiqueta: 'Oscuro' },
  { id: 'auto', etiqueta: 'Automático' },
];

export function SelectorTema() {
  const { preferencia, setPreferencia } = useTema();

  const manejarTeclado = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    indiceActual: number
  ) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const siguiente = (indiceActual + 1) % OPCIONES.length;
      setPreferencia(OPCIONES[siguiente].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const anterior = (indiceActual - 1 + OPCIONES.length) % OPCIONES.length;
      setPreferencia(OPCIONES[anterior].id);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">Tema</span>
      <div
        role="radiogroup"
        aria-label="Seleccionar tema"
        className="flex items-center rounded-full bg-soft/60 p-1 border border-line"
      >
        {OPCIONES.map((opcion, index) => {
          const seleccionada = preferencia === opcion.id;
          return (
            <button
              key={opcion.id}
              type="button"
              role="radio"
              aria-checked={seleccionada}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => setPreferencia(opcion.id)}
              onKeyDown={(e) => manejarTeclado(e, index)}
              className={`flex-1 rounded-full py-1 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                seleccionada
                  ? 'bg-accent text-bg shadow-xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
