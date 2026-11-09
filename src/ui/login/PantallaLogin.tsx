import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent as EventoTeclado } from 'react';
import { Lock } from 'lucide-react';
import type { Usuario } from '../../kernel/types';
import { verificarPin } from '../../kernel/users/verificarPin';
import { puedeIniciarSesion } from '../../kernel/users/decisiones';
import { useUsuariosStore } from '../../store/usuarios';
import {
  DIGITOS_PIN,
  ESPERA_BLOQUEO_MS,
  INTENTOS_MAXIMOS,
} from '../../config/login';
import { registrar } from '../../system/logging/servicio';
import { Avatar } from '../components/Avatar';
import { Boton } from '../components/Boton';
import { IndicadorPin } from '../components/IndicadorPin';

type PantallaLoginProps = {
  onIngresar: (usuario: Usuario) => void;
  usuarios?: Usuario[];
};

export function PantallaLogin({
  onIngresar,
  usuarios: usuariosProp,
}: PantallaLoginProps) {
  const usuariosStore = useUsuariosStore((s) => s.usuarios);
  const actualizarUltimoAcceso = useUsuariosStore((s) => s.actualizarUltimoAcceso);
  const usuarios = usuariosProp ?? usuariosStore;

  const [usuarioId, setUsuarioId] = useState(usuarios[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [intentosRestantes, setIntentosRestantes] = useState(INTENTOS_MAXIMOS);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [bloqueadoPorIntentos, setBloqueadoPorIntentos] = useState(false);

  const usuarioActivo = usuarios.find((u) => u.id === usuarioId) ?? usuarios[0];
  const cuentaBloqueada = usuarioActivo ? !puedeIniciarSesion(usuarioActivo) : false;

  function seleccionarUsuario(usuario: Usuario) {
    setUsuarioId(usuario.id);
    setPin('');
    setMensajeError(null);
  }

  // Si el administrador bloquea a un usuario con sesión activa: la acción solo
  // afecta al próximo inicio de sesión (no se expulsa al usuario de su sesión activa).
  const intentarEntrar = useCallback(() => {
    if (!usuarioActivo || bloqueadoPorIntentos || cuentaBloqueada || pin.length !== DIGITOS_PIN) {
      return;
    }

    if (verificarPin(usuarioActivo, pin)) {
      setMensajeError(null);
      actualizarUltimoAcceso(usuarioActivo.id);
      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: `Inicio de sesión correcto de ${usuarioActivo.nombre}`,
        usuarioId: usuarioActivo.id,
      });
      onIngresar(usuarioActivo);
      return;
    }

    const siguientes = intentosRestantes - 1;
    setPin('');
    setIntentosRestantes(siguientes);

    registrar({
      categoria: 'seguridad',
      gravedad: 'aviso',
      mensaje: `PIN incorrecto para ${usuarioActivo.nombre} (${siguientes} intento${siguientes === 1 ? '' : 's'} restante${siguientes === 1 ? '' : 's'})`,
      usuarioId: usuarioActivo.id,
    });

    if (siguientes <= 0) {
      setBloqueadoPorIntentos(true);
      registrar({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: `Bloqueo por intentos agotados para ${usuarioActivo.nombre}`,
        usuarioId: usuarioActivo.id,
      });
      setMensajeError('Espera un momento antes de intentarlo de nuevo');
      return;
    }

    setMensajeError('PIN incorrecto');
  }, [
    actualizarUltimoAcceso,
    bloqueadoPorIntentos,
    cuentaBloqueada,
    intentosRestantes,
    onIngresar,
    pin,
    usuarioActivo,
  ]);

  useEffect(() => {
    if (!bloqueadoPorIntentos) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setBloqueadoPorIntentos(false);
      setIntentosRestantes(INTENTOS_MAXIMOS);
      setMensajeError(null);
      setPin('');
    }, ESPERA_BLOQUEO_MS);

    return () => window.clearTimeout(temporizador);
  }, [bloqueadoPorIntentos]);

  useEffect(() => {
    function alPulsarTecla(evento: KeyboardEvent) {
      // Si la cuenta está bloqueada por el administrador o bloqueada temporalmente por intentos,
      // no se permite interactuar con el PIN
      if (bloqueadoPorIntentos || cuentaBloqueada) {
        return;
      }

      if (evento.key === 'Enter') {
        evento.preventDefault();
        intentarEntrar();
        return;
      }

      if (evento.key === 'Backspace') {
        evento.preventDefault();
        setPin((actual) => actual.slice(0, -1));
        setMensajeError(null);
        return;
      }

      if (/^[0-9]$/.test(evento.key) && pin.length < DIGITOS_PIN) {
        evento.preventDefault();
        setPin((actual) => `${actual}${evento.key}`);
        setMensajeError(null);
      }
    }

    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [bloqueadoPorIntentos, cuentaBloqueada, intentarEntrar, pin]);

  function alTeclaGrupo(evento: EventoTeclado<HTMLDivElement>) {
    if (!usuarioActivo) {
      return;
    }

    const indice = usuarios.findIndex((u) => u.id === usuarioActivo.id);
    if (indice < 0) {
      return;
    }

    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      seleccionarUsuario(usuarios[(indice + 1) % usuarios.length]);
    }

    if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      seleccionarUsuario(usuarios[(indice - 1 + usuarios.length) % usuarios.length]);
    }
  }

  if (!usuarioActivo) {
    return null;
  }

  const puedeEntrar =
    !bloqueadoPorIntentos && !cuentaBloqueada && pin.length === DIGITOS_PIN;

  return (
    <main className="flex h-full w-full flex-col items-center justify-center bg-bg px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">¿Quién eres?</h1>

      {cuentaBloqueada && (
        <div
          role="status"
          aria-label="Esta cuenta está bloqueada. Pídele al administrador que la habilite."
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-warm px-4 py-1.5 text-xs font-semibold text-warm-ink border border-warm-line shadow-2xs"
        >
          <Lock className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
          <span>Esta cuenta está bloqueada. Pídele al administrador que la habilite.</span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Usuarios"
        className="mt-8 flex items-start gap-10"
        onKeyDown={alTeclaGrupo}
      >
        {usuarios.map((usuario) => (
          <Avatar
            key={usuario.id}
            nombre={usuario.nombre}
            inicial={usuario.inicial}
            seleccionado={usuario.id === usuarioActivo.id}
            esAdmin={usuario.rol === 'admin'}
            bloqueado={usuario.estado === 'bloqueado'}
            foto={usuario.foto}
            tabIndex={usuario.id === usuarioActivo.id ? 0 : -1}
            onSeleccionar={() => seleccionarUsuario(usuario)}
          />
        ))}
      </div>

      <div className="mt-10">
        <IndicadorPin digitosIngresados={pin.length} totalDigitos={DIGITOS_PIN} />
      </div>

      <div className="mt-8">
        <Boton deshabilitado={!puedeEntrar} onClick={intentarEntrar}>
          Entrar
        </Boton>
      </div>

      {mensajeError ? (
        <p role="alert" className="mt-4 text-sm text-warm-ink">
          {mensajeError}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        {bloqueadoPorIntentos
          ? null
          : `Quedan ${intentosRestantes} intento${intentosRestantes === 1 ? '' : 's'}`}
        {!bloqueadoPorIntentos ? (
          <span className="mx-2 text-line" aria-hidden="true">
            ·
          </span>
        ) : null}
        {/* TODO: abrir flujo de recuperación de PIN */}
        <button
          type="button"
          className="text-accent-strong underline-offset-2 hover:underline"
        >
          ¿Olvidaste tu PIN?
        </button>
      </p>
    </main>
  );
}
