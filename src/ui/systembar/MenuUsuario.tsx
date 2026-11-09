import { useEffect, useRef } from 'react';
import { Users, LogOut, SlidersHorizontal } from 'lucide-react';
import { useSesion } from '../../store/sesion';
import { SelectorTema } from '../components/SelectorTema';

type MenuUsuarioProps = {
  abierto: boolean;
  onCerrar: () => void;
  onCambiarUsuario: () => void;
  onCerrarSesion: () => void;
  onAbrirConfiguracion?: () => void;
};

export function MenuUsuario({
  abierto,
  onCerrar,
  onCambiarUsuario,
  onCerrarSesion,
  onAbrirConfiguracion,
}: MenuUsuarioProps) {
  const usuario = useSesion((s) => s.usuario);
  const menuRef = useRef<HTMLDivElement>(null);
  const primerBotonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const timer = setTimeout(() => {
      primerBotonRef.current?.focus();
    }, 0);

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
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
  }, [abierto, onCerrar]);

  if (!abierto || !usuario) return null;

  const rolTexto = usuario.rol === 'admin' ? 'Administrador' : 'Usuario';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Menú de usuario"
      className="absolute right-12 top-12 z-50 flex min-w-[220px] flex-col gap-3 rounded-3xl border border-line bg-card p-4 shadow-xl select-none"
    >
      {/* Cabecera con Avatar grande */}
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-soft text-lg font-bold text-ink overflow-hidden">
          {usuario.foto ? (
            <img
              src={usuario.foto}
              alt=""
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            usuario.inicial
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-fredoka text-base font-semibold text-ink">
            {usuario.nombre}
          </span>
          <span className="text-xs text-muted font-medium">{rolTexto}</span>
        </div>
      </div>

      <div className="h-px w-full bg-line/60" aria-hidden="true" />

      {/* Opciones de sesión */}
      <div className="flex flex-col gap-1">
        <button
          ref={primerBotonRef}
          type="button"
          role="menuitem"
          onClick={() => {
            onCerrar();
            onCambiarUsuario();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Users size={16} className="text-muted" aria-hidden="true" />
          <span>Cambiar de usuario</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onCerrar();
            onAbrirConfiguracion?.();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SlidersHorizontal size={16} className="text-muted" aria-hidden="true" />
          <span>Configuración</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onCerrar();
            onCerrarSesion();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOut size={16} className="text-muted" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      <div className="h-px w-full bg-line/60" aria-hidden="true" />

      {/* Selector de tema */}
      <div className="px-1 pb-1">
        <SelectorTema />
      </div>
    </div>
  );
}
