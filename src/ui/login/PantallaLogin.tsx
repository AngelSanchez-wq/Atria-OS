import { useEffect, useState } from 'react';
import type { KeyboardEvent as EventoTeclado } from 'react';
import type { Usuario } from '../../kernel/types';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import { verificarPin } from '../../kernel/users/verificarPin';
import {
  DIGITOS_PIN,
  ESPERA_BLOQUEO_MS,
  INTENTOS_MAXIMOS,
} from '../../config/login';
import { Avatar } from '../components/Avatar';
import { Boton } from '../components/Boton';
import { IndicadorPin } from '../components/IndicadorPin';

type PantallaLoginProps = {
  onIngresar: (usuario: Usuario) => void;
  usuarios?: Usuario[];
};

export function PantallaLogin({
  onIngresar,
  usuarios = USUARIOS_SEMILLA,
}: PantallaLoginProps) {
  const [usuarioId, setUsuarioId] = useState(usuarios[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [intentosRestantes, setIntentosRestantes] = useState(INTENTOS_MAXIMOS);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  const usuarioActivo = usuarios.find((u) => u.id === usuarioId) ?? usuarios[0];

  function seleccionarUsuario(usuario: Usuario) {
    setUsuarioId(usuario.id);
    setPin('');
    setMensajeError(null);
  }

  function intentarEntrar() {
    if (!usuarioActivo || bloqueado || pin.length !== DIGITOS_PIN) {
      return;
    }

    if (verificarPin(usuarioActivo, pin)) {
      setMensajeError(null);
      onIngresar(usuarioActivo);
      return;
    }

    const siguientes = intentosRestantes - 1;
    setPin('');
    setIntentosRestantes(siguientes);

    if (siguientes <= 0) {
      setBloqueado(true);
      setMensajeError('Espera un momento antes de intentarlo de nuevo');
      return;
    }

    setMensajeError('PIN incorrecto');
  }

  useEffect(() => {
    if (!bloqueado) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setBloqueado(false);
      setIntentosRestantes(INTENTOS_MAXIMOS);
      setMensajeError(null);
      setPin('');
    }, ESPERA_BLOQUEO_MS);

    return () => window.clearTimeout(temporizador);
  }, [bloqueado]);

  useEffect(() => {
    function alPulsarTecla(evento: KeyboardEvent) {
      if (bloqueado) {
        return;
      }

      if (evento.key === 'Enter') {
        evento.preventDefault();
        if (!usuarioActivo || pin.length !== DIGITOS_PIN) {
          return;
        }

        if (verificarPin(usuarioActivo, pin)) {
          setMensajeError(null);
          onIngresar(usuarioActivo);
          return;
        }

        const siguientes = intentosRestantes - 1;
        setPin('');
        setIntentosRestantes(siguientes);

        if (siguientes <= 0) {
          setBloqueado(true);
          setMensajeError('Espera un momento antes de intentarlo de nuevo');
          return;
        }

        setMensajeError('PIN incorrecto');
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
  }, [bloqueado, pin, intentosRestantes, usuarioActivo, onIngresar]);

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

  const puedeEntrar = !bloqueado && pin.length === DIGITOS_PIN;

  return (
    <main className="flex h-full w-full flex-col items-center justify-center bg-bg px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">¿Quién eres?</h1>

      <div
        role="radiogroup"
        aria-label="Usuarios"
        className="mt-10 flex items-start gap-10"
        onKeyDown={alTeclaGrupo}
      >
        {usuarios.map((usuario) => (
          <Avatar
            key={usuario.id}
            nombre={usuario.nombre}
            inicial={usuario.inicial}
            seleccionado={usuario.id === usuarioActivo.id}
            esAdmin={usuario.rol === 'admin'}
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
        {bloqueado
          ? null
          : `Quedan ${intentosRestantes} intento${intentosRestantes === 1 ? '' : 's'}`}
        {!bloqueado ? (
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
