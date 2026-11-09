import { useState, useRef } from 'react';
import { Bell, Power, Volume2, Volume1, VolumeX, Wifi, WifiOff } from 'lucide-react';
import {
  ALTURA_BARRA_CLASE,
  CLASE_CIRCULO_BUHO,
  TAMANO_BUHO_BARRA,
  TAMANO_ICONO_BARRA,
} from '../../config/systembar';
import { useHora } from '../../hooks/useHora';
import { obtenerEstadoSistema } from '../../system/estado-sistema';
import { useSesion } from '../../store/sesion';
import { Buho } from '../components/Buho';
import { BotonIcono } from './BotonIcono';
import { IndicadorBateria } from './IndicadorBateria';
import { MenuEncendido } from './MenuEncendido';
import { MenuUsuario } from './MenuUsuario';
import { PanelVolumen } from './PanelVolumen';
import { PanelWifi } from './PanelWifi';
import { PanelBateria } from './PanelBateria';
import { RedWifi, REDES_SIMULADAS_DISPONIBLES } from '../../store/red';
import { EstadoBateria } from '../../kernel/power/bateria';

type BarraSistemaProps = {
  titulo?: string;
  notificaciones?: number;
  estadoBuho?: 'reposo' | 'foco' | 'logro';
  volumen?: number;
  silenciado?: boolean;

  // Wi-Fi y Red
  redEnLinea?: boolean;
  redCalidad?: string;
  wifiHabilitado?: boolean;
  redConectadaId?: string | null;
  redConectandoId?: string | null;
  redes?: RedWifi[];
  onAlternarWifi?: (activo: boolean) => void;
  onConectarRed?: (id: string) => void;

  // Batería
  bateriaNivel?: number;
  bateriaCargando?: boolean;
  bateriaEstado?: EstadoBateria;
  bateriaTiempoRestante?: string | null;
  bateriaEsSimulada?: boolean;
  ahorroEnergia?: boolean;
  onAlternarAhorroEnergia?: (activo: boolean) => void;

  // Callbacks generales
  onVolver?: () => void;
  onWifi?: () => void;
  onVolumen?: () => void;
  onCambiarVolumen?: (volumen: number) => void;
  onAlternarSilencio?: () => void;
  onBateria?: () => void;
  onNotificaciones?: () => void;
  onUsuario?: () => void;
  onEncendido?: () => void;
  onBloquear?: () => void;
  onSuspender?: () => void;
  onReiniciar?: () => void;
  onApagar?: () => void;
  onCambiarUsuario?: () => void;
  onCerrarSesion?: () => void;
  onConfiguracion?: () => void;
};

export function BarraSistema({
  titulo,
  notificaciones = 0,
  estadoBuho = 'foco',
  volumen,
  silenciado,
  redEnLinea = true,
  redCalidad,
  wifiHabilitado = true,
  redConectadaId = 'casa-5g',
  redConectandoId = null,
  redes = REDES_SIMULADAS_DISPONIBLES,
  onAlternarWifi,
  onConectarRed,
  bateriaNivel,
  bateriaCargando = false,
  bateriaEstado = 'descargando',
  bateriaTiempoRestante,
  bateriaEsSimulada = true,
  ahorroEnergia = false,
  onAlternarAhorroEnergia,
  onVolver,
  onWifi,
  onVolumen,
  onCambiarVolumen,
  onAlternarSilencio,
  onBateria,
  onNotificaciones,
  onUsuario,
  onEncendido,
  onBloquear,
  onSuspender,
  onReiniciar,
  onApagar,
  onCambiarUsuario,
  onCerrarSesion,
  onConfiguracion,
}: BarraSistemaProps) {
  const { hora, fecha, ahora } = useHora();
  const estado = obtenerEstadoSistema();
  const usuario = useSesion((s) => s.usuario);
  const inicial = usuario?.inicial ?? '?';
  const nombreUsuario = usuario?.nombre ?? 'Usuario';

  const nivelBateriaEfectivo = bateriaNivel ?? estado.bateriaPorcentaje;

  const [menuEncendidoAbierto, setMenuEncendidoAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [panelVolumenAbierto, setPanelVolumenAbierto] = useState(false);
  const [panelWifiAbierto, setPanelWifiAbierto] = useState(false);
  const [panelBateriaAbierto, setPanelBateriaAbierto] = useState(false);

  const botonPowerRef = useRef<HTMLButtonElement>(null);
  const botonUsuarioRef = useRef<HTMLButtonElement>(null);
  const botonVolumenRef = useRef<HTMLButtonElement>(null);
  const botonWifiRef = useRef<HTMLButtonElement>(null);
  const botonBateriaRef = useRef<HTMLButtonElement>(null);

  const alternarMenuEncendido = () => {
    setMenuUsuarioAbierto(false);
    setPanelVolumenAbierto(false);
    setPanelWifiAbierto(false);
    setPanelBateriaAbierto(false);
    onEncendido?.();
    setMenuEncendidoAbierto((prev) => !prev);
  };

  const cerrarMenuEncendido = () => {
    setMenuEncendidoAbierto(false);
    botonPowerRef.current?.focus();
  };

  const alternarMenuUsuario = () => {
    setMenuEncendidoAbierto(false);
    setPanelVolumenAbierto(false);
    setPanelWifiAbierto(false);
    setPanelBateriaAbierto(false);
    onUsuario?.();
    setMenuUsuarioAbierto((prev) => !prev);
  };

  const cerrarMenuUsuario = () => {
    setMenuUsuarioAbierto(false);
    botonUsuarioRef.current?.focus();
  };

  const alternarPanelVolumen = () => {
    setMenuEncendidoAbierto(false);
    setMenuUsuarioAbierto(false);
    setPanelWifiAbierto(false);
    setPanelBateriaAbierto(false);
    onVolumen?.();
    setPanelVolumenAbierto((prev) => !prev);
  };

  const cerrarPanelVolumen = () => {
    setPanelVolumenAbierto(false);
    botonVolumenRef.current?.focus();
  };

  const alternarPanelWifi = () => {
    setMenuEncendidoAbierto(false);
    setMenuUsuarioAbierto(false);
    setPanelVolumenAbierto(false);
    setPanelBateriaAbierto(false);
    onWifi?.();
    setPanelWifiAbierto((prev) => !prev);
  };

  const cerrarPanelWifi = () => {
    setPanelWifiAbierto(false);
    botonWifiRef.current?.focus();
  };

  const alternarPanelBateria = () => {
    setMenuEncendidoAbierto(false);
    setMenuUsuarioAbierto(false);
    setPanelVolumenAbierto(false);
    setPanelWifiAbierto(false);
    onBateria?.();
    setPanelBateriaAbierto((prev) => !prev);
  };

  const cerrarPanelBateria = () => {
    setPanelBateriaAbierto(false);
    botonBateriaRef.current?.focus();
  };

  const IconoVolumen = silenciado
    ? VolumeX
    : (volumen ?? 0.7) <= 0.5
    ? Volume1
    : Volume2;

  const etiquetaVolumen = silenciado
    ? 'Silenciado'
    : volumen !== undefined
    ? `Volumen ${Math.round(volumen * 100)} %`
    : 'Volumen';

  // Ícono de Wi-Fi refleja el estado REAL de conexión: desconectado si no hay internet real
  const wifiConectadoReal = redEnLinea && wifiHabilitado;
  const IconoWifi = wifiConectadoReal ? Wifi : WifiOff;

  // Etiqueta accesible de Wi-Fi
  const redConectada = redes.find((r) => r.id === redConectadaId);
  let etiquetaWifi: string;
  if (!redEnLinea) {
    etiquetaWifi = 'Wi-Fi, sin conexión';
  } else if (!wifiHabilitado) {
    etiquetaWifi = 'Wi-Fi desactivado';
  } else if (redConectada) {
    etiquetaWifi = `Wi-Fi, conectado a ${redConectada.nombre}`;
  } else {
    etiquetaWifi = 'Wi-Fi, desconectado';
  }

  return (
    <header
      role="banner"
      className={`relative flex ${ALTURA_BARRA_CLASE} w-full items-center gap-3 border-b border-line bg-card px-4`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={CLASE_CIRCULO_BUHO}>
          <Buho estado={estadoBuho} tamano={TAMANO_BUHO_BARRA} />
        </span>
        {onVolver ? (
          <button
            type="button"
            onClick={onVolver}
            className="text-sm font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            ← Escritorio
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        {titulo ? (
          <p className="truncate font-display text-base font-semibold text-ink">
            {titulo}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <time
          dateTime={ahora.toISOString()}
          className="flex flex-col items-end leading-tight text-muted"
        >
          <span className="text-sm font-semibold">{hora}</span>
          <span className="text-xs">{fecha}</span>
        </time>

        <BotonIcono
          ref={botonWifiRef}
          etiqueta={etiquetaWifi}
          onClick={alternarPanelWifi}
          className={panelWifiAbierto ? 'text-accent' : 'text-muted'}
        >
          <IconoWifi size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>

        <BotonIcono
          ref={botonVolumenRef}
          etiqueta={etiquetaVolumen}
          onClick={alternarPanelVolumen}
          className={panelVolumenAbierto ? 'text-accent' : 'text-muted'}
        >
          <IconoVolumen size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>

        <IndicadorBateria
          ref={botonBateriaRef}
          porcentaje={nivelBateriaEfectivo}
          cargando={bateriaCargando}
          estado={bateriaEstado}
          abierto={panelBateriaAbierto}
          onClick={alternarPanelBateria}
        />

        <BotonIcono
          etiqueta={`Notificaciones, ${notificaciones}`}
          onClick={onNotificaciones}
          className="relative text-accent"
        >
          <Bell size={TAMANO_ICONO_BARRA} aria-hidden="true" />
          {notificaciones > 0 ? (
            <span
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-bg"
              aria-hidden="true"
            >
              {notificaciones}
            </span>
          ) : null}
        </BotonIcono>

        <BotonIcono
          ref={botonUsuarioRef}
          etiqueta={nombreUsuario}
          onClick={alternarMenuUsuario}
          className="text-ink"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-soft text-sm font-bold">
            {inicial}
          </span>
        </BotonIcono>

        <BotonIcono
          ref={botonPowerRef}
          etiqueta="Apagar o reiniciar"
          onClick={alternarMenuEncendido}
          className={menuEncendidoAbierto ? 'text-accent' : 'text-muted'}
        >
          <Power size={TAMANO_ICONO_BARRA} aria-hidden="true" />
        </BotonIcono>
      </div>

      <MenuEncendido
        abierto={menuEncendidoAbierto}
        onCerrar={cerrarMenuEncendido}
        onBloquear={() => {
          cerrarMenuEncendido();
          onBloquear?.();
        }}
        onSuspender={() => {
          cerrarMenuEncendido();
          onSuspender?.();
        }}
        onReiniciar={() => {
          cerrarMenuEncendido();
          onReiniciar?.();
        }}
        onApagar={() => {
          cerrarMenuEncendido();
          onApagar?.();
        }}
      />

      <MenuUsuario
        abierto={menuUsuarioAbierto}
        onCerrar={cerrarMenuUsuario}
        onCambiarUsuario={() => {
          cerrarMenuUsuario();
          onCambiarUsuario?.();
        }}
        onCerrarSesion={() => {
          cerrarMenuUsuario();
          onCerrarSesion?.();
        }}
        onAbrirConfiguracion={() => {
          cerrarMenuUsuario();
          onConfiguracion?.();
        }}
      />

      <PanelVolumen
        abierto={panelVolumenAbierto}
        volumen={volumen ?? 0.7}
        silenciado={silenciado ?? false}
        onCerrar={cerrarPanelVolumen}
        onCambiarVolumen={onCambiarVolumen ?? (() => {})}
        onAlternarSilencio={onAlternarSilencio ?? (() => {})}
      />

      <PanelWifi
        abierto={panelWifiAbierto}
        enLinea={redEnLinea}
        calidad={redCalidad}
        wifiHabilitado={wifiHabilitado}
        redConectadaId={redConectadaId}
        conectandoId={redConectandoId}
        redes={redes}
        onCerrar={cerrarPanelWifi}
        onAlternarWifi={onAlternarWifi ?? (() => {})}
        onConectarRed={onConectarRed ?? (() => {})}
      />

      <PanelBateria
        abierto={panelBateriaAbierto}
        nivel={nivelBateriaEfectivo}
        cargando={bateriaCargando}
        estado={bateriaEstado}
        tiempoRestante={bateriaTiempoRestante ?? null}
        esSimulada={bateriaEsSimulada}
        ahorroEnergia={ahorroEnergia}
        onCerrar={cerrarPanelBateria}
        onAlternarAhorroEnergia={onAlternarAhorroEnergia ?? (() => {})}
      />
    </header>
  );
}
