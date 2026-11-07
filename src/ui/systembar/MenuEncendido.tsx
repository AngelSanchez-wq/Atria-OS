import { useEffect, useRef, useState } from 'react';
import { Lock, Moon, RotateCcw, Power, type LucideIcon } from 'lucide-react';

type MenuEncendidoProps = {
  abierto: boolean;
  onCerrar: () => void;
  onBloquear: () => void;
  onSuspender: () => void;
  onReiniciar: () => void;
  onApagar: () => void;
};

type OpcionMenu = {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  accion: () => void;
  divisorAntes?: boolean;
};

export function MenuEncendido({
  abierto,
  onCerrar,
  onBloquear,
  onSuspender,
  onReiniciar,
  onApagar,
}: MenuEncendidoProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indiceFoco, setIndiceFoco] = useState(0);

  const opciones: OpcionMenu[] = [
    {
      id: 'bloquear',
      etiqueta: 'Bloquear',
      icono: Lock,
      accion: () => {
        onCerrar();
        onBloquear();
      },
    },
    {
      id: 'suspender',
      etiqueta: 'Suspender',
      icono: Moon,
      accion: () => {
        onCerrar();
        onSuspender();
      },
    },
    {
      id: 'reiniciar',
      etiqueta: 'Reiniciar',
      icono: RotateCcw,
      accion: () => {
        onCerrar();
        onReiniciar();
      },
    },
    {
      id: 'apagar',
      etiqueta: 'Apagar',
      icono: Power,
      divisorAntes: true,
      accion: () => {
        onCerrar();
        onApagar();
      },
    },
  ];

  useEffect(() => {
    if (!abierto) return;

    // Foco en el primer elemento al abrir
    const timer = setTimeout(() => {
      itemsRef.current[0]?.focus();
    }, 0);

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndiceFoco((prev) => {
          const next = (prev + 1) % opciones.length;
          itemsRef.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndiceFoco((prev) => {
          const next = (prev - 1 + opciones.length) % opciones.length;
          itemsRef.current[next]?.focus();
          return next;
        });
      }
    };

    const alClicFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    window.addEventListener('mousedown', alClicFuera);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', alPulsarTecla);
      window.removeEventListener('mousedown', alClicFuera);
    };
  }, [abierto, onCerrar, opciones.length]);

  if (!abierto) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Menú de encendido"
      className="absolute right-4 top-12 z-50 flex min-w-[180px] flex-col rounded-2xl border border-line bg-card p-1.5 shadow-xl select-none"
    >
      {opciones.map((opcion, index) => {
        const Icono = opcion.icono;
        return (
          <div key={opcion.id} className="flex flex-col">
            {opcion.divisorAntes && (
              <div className="my-1 h-px bg-line/60" aria-hidden="true" />
            )}
            <button
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={indiceFoco === index ? 0 : -1}
              onClick={opcion.accion}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icono size={16} className="text-muted" aria-hidden="true" />
              <span>{opcion.etiqueta}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
