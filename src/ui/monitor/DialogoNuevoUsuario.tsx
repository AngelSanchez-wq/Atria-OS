import { useEffect, useRef, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Boton } from '../components/Boton';
import { SelectorSegmentado } from '../components/SelectorSegmentado';
import { IndicadorPin } from '../components/IndicadorPin';
import { DIGITOS_PIN } from '../../config/login';
import { RolUsuario } from '../../kernel/types';
import { DatosCrearUsuario } from '../../kernel/users/operaciones';

type DialogoNuevoUsuarioProps = {
  abierto: boolean;
  onCrear: (datos: DatosCrearUsuario) => { ok: boolean; motivo?: string };
  onCancelar: () => void;
};

const OPCIONES_ROL = [
  { valor: 'estandar' as const, etiqueta: 'Estándar' },
  { valor: 'admin' as const, etiqueta: 'Administrador' },
] as const;

export function DialogoNuevoUsuario({
  abierto,
  onCrear,
  onCancelar,
}: DialogoNuevoUsuarioProps) {
  if (!abierto) return null;

  return (
    <DialogoNuevoUsuarioModal
      key="dialogo-nuevo-usuario-activo"
      onCrear={onCrear}
      onCancelar={onCancelar}
    />
  );
}

function DialogoNuevoUsuarioModal({
  onCrear,
  onCancelar,
}: {
  onCrear: (datos: DatosCrearUsuario) => { ok: boolean; motivo?: string };
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolUsuario>('estandar');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onCancelarRef = useRef(onCancelar);
  const onCrearRef = useRef(onCrear);

  useEffect(() => {
    onCancelarRef.current = onCancelar;
    onCrearRef.current = onCrear;
  }, [onCancelar, onCrear]);

  const inputNombreRef = useRef<HTMLInputElement>(null);
  const refRol = useRef<HTMLDivElement>(null);
  const inputPinRef = useRef<HTMLInputElement>(null);
  const botonCancelarRef = useRef<HTMLButtonElement>(null);
  const botonCrearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Foco inicial sincrónico en el campo Nombre UNA SOLA VEZ al abrir el diálogo
    inputNombreRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelarRef.current();
      }
    };

    window.addEventListener('keydown', alPulsarTecla);
    return () => {
      window.removeEventListener('keydown', alPulsarTecla);
    };
  }, []); // Dependencias vacías: no se vuelve a ejecutar con re-renders periódicos del padre

  const manejarTecladoDialogo = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    // Elementos enfocables en orden estricto de navegación
    const elementoRol = refRol.current?.querySelector<HTMLButtonElement>(
      '[role="radio"][tabindex="0"]'
    );
    const elementosEnfocables: (HTMLElement | null)[] = [
      inputNombreRef.current,
      elementoRol ?? null,
      inputPinRef.current,
      botonCancelarRef.current,
      botonCrearRef.current,
    ];

    const validos = elementosEnfocables.filter(
      (el): el is HTMLElement => el !== null && !el.hasAttribute('disabled')
    );
    if (validos.length === 0) return;

    const primerElemento = validos[0];
    const ultimoElemento = validos[validos.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === primerElemento) {
        e.preventDefault();
        ultimoElemento.focus();
      }
    } else {
      if (document.activeElement === ultimoElemento) {
        e.preventDefault();
        primerElemento.focus();
      }
    }
  };

  const manejarEnvio = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length === 0) {
      setError('Escribe un nombre para el usuario.');
      inputNombreRef.current?.focus();
      return;
    }

    if (pin.length !== DIGITOS_PIN || !/^\d+$/.test(pin)) {
      setError(`El PIN debe tener exactamente ${DIGITOS_PIN} números.`);
      inputPinRef.current?.focus();
      return;
    }

    const res = onCrearRef.current({
      nombre: nombreLimpio,
      rol,
      pin,
    });

    if (!res.ok) {
      if (res.motivo === 'nombre-duplicado') {
        setError('Ya existe un usuario con ese nombre.');
        inputNombreRef.current?.focus();
      } else if (res.motivo === 'pin-invalido') {
        setError(`El PIN debe contener ${DIGITOS_PIN} dígitos numéricos.`);
        inputPinRef.current?.focus();
      } else {
        setError(res.motivo ?? 'No se pudo crear el usuario.');
      }
      return;
    }

    onCancelar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4 select-none"
      onClick={onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-dialogo-nuevo-usuario"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTecladoDialogo}
        className="flex w-full max-w-md max-h-[85vh] flex-col rounded-3xl border border-line bg-card shadow-xl overflow-hidden"
      >
        {/* Cabecera del diálogo (fija) */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-line/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-accent">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <h2
              id="titulo-dialogo-nuevo-usuario"
              className="font-fredoka text-xl font-semibold text-ink"
            >
              Nuevo usuario
            </h2>
          </div>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar diálogo"
            onClick={onCancelar}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario que contiene cuerpo desplazable y pie fijo */}
        <form onSubmit={manejarEnvio} className="flex flex-1 flex-col overflow-hidden min-h-0">
          {/* Cuerpo desplazable */}
          <div
            data-testid="cuerpo-dialogo-desplazable"
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 min-h-0"
          >
            {/* Campo Nombre */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nuevo-usuario-nombre"
                className="text-xs font-bold uppercase tracking-wider text-muted"
              >
                Nombre
              </label>
              <input
                ref={inputNombreRef}
                id="nuevo-usuario-nombre"
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. Sofía Méndez"
                className="w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* Campo Rol */}
            <div ref={refRol} className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Rol
              </span>
              <SelectorSegmentado
                opciones={OPCIONES_ROL}
                valorSeleccionado={rol}
                onSeleccionar={setRol}
                ariaLabel="Seleccionar rol para el nuevo usuario"
              />
            </div>

            {/* Campo PIN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nuevo-usuario-pin"
                className="text-xs font-bold uppercase tracking-wider text-muted"
              >
                PIN de {DIGITOS_PIN} dígitos
              </label>
              <div className="flex flex-col gap-2">
                <input
                  ref={inputPinRef}
                  id="nuevo-usuario-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={DIGITOS_PIN}
                  autoComplete="off"
                  aria-label="PIN de 4 dígitos"
                  value={pin}
                  onChange={(e) => {
                    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, DIGITOS_PIN);
                    setPin(soloDigitos);
                    setError(null);
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.5em] font-mono text-lg rounded-2xl border border-line bg-card px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex justify-center py-1">
                  <IndicadorPin digitosIngresados={pin.length} totalDigitos={DIGITOS_PIN} />
                </div>
              </div>
              <p className="text-xs text-muted">
                El PIN solo se usa para iniciar sesión y debe contener solo números.
              </p>
            </div>

            {/* Mensaje de error de validación */}
            {error && (
              <p role="alert" className="text-xs font-semibold text-warm-ink">
                {error}
              </p>
            )}
          </div>

          {/* Pie fijo */}
          <div
            data-testid="pie-dialogo-fijo"
            className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-line/60 shrink-0 bg-card"
          >
            <Boton
              ref={botonCancelarRef}
              type="button"
              variante="secundario"
              onClick={onCancelar}
              className="!px-5 !py-2 text-sm"
            >
              Cancelar
            </Boton>
            <Boton
              ref={botonCrearRef}
              type="submit"
              variante="principal"
              className="!px-5 !py-2 text-sm"
            >
              Crear usuario
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
