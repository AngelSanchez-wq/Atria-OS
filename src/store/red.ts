import { create } from 'zustand';
import { platform } from '../platform/web';

export type RedWifi = {
  id: string;
  nombre: string;
  seguridad: boolean;
  intensidad: 1 | 2 | 3;
};

export const REDES_SIMULADAS_DISPONIBLES: RedWifi[] = [
  { id: 'casa-5g', nombre: 'Casa-5G', seguridad: true, intensidad: 3 },
  { id: 'universidad', nombre: 'Universidad', seguridad: true, intensidad: 2 },
  { id: 'cafeteria', nombre: 'Cafetería', seguridad: true, intensidad: 2 },
];

export const CLAVE_PERSISTENCIA_WIFI_HABILITADO = 'atria_wifi_habilitado';
export const CLAVE_PERSISTENCIA_WIFI_RED = 'atria_wifi_red';

export type EstadoRedStore = {
  /** Estado REAL de conexión a internet del equipo reportado por platform. */
  enLinea: boolean;
  /** Calidad descriptiva de la conexión si el navegador expone NetworkInformation. */
  calidad?: string;
  /** Estado del interruptor simulado de Wi-Fi en Atria-OS (persistido). */
  wifiHabilitado: boolean;
  /** ID de la red Wi-Fi simulada seleccionada (persistido). */
  redConectadaId: string | null;
  /** ID de la red a la que se está conectando en simulación breve ("Conectando…"). */
  conectandoId: string | null;
  /** Lista de redes disponibles simuladas. */
  redes: RedWifi[];

  setEnLinea: (enLinea: boolean, calidad?: string) => void;
  setWifiHabilitado: (habilitado: boolean) => void;
  conectarRed: (id: string) => void;
  restablecer: () => void;
};

// Carga de estado persistido con platform
// TODO: Guardar preferencias de Wi-Fi por usuario cuando exista multiusuario con persistencia individual
const wifiHabilitadoInicial = platform.loadState<boolean>(
  CLAVE_PERSISTENCIA_WIFI_HABILITADO,
  true
);

const redConectadaInicial = platform.loadState<string | null>(
  CLAVE_PERSISTENCIA_WIFI_RED,
  'casa-5g'
);

export const useRedStore = create<EstadoRedStore>((set, get) => ({
  enLinea: true,
  calidad: undefined,
  wifiHabilitado: wifiHabilitadoInicial,
  redConectadaId: redConectadaInicial,
  conectandoId: null,
  redes: REDES_SIMULADAS_DISPONIBLES,

  setEnLinea: (enLinea, calidad) => {
    set({ enLinea, calidad });
  },

  setWifiHabilitado: (habilitado) => {
    set({ wifiHabilitado: habilitado });
    platform.saveState(CLAVE_PERSISTENCIA_WIFI_HABILITADO, habilitado);
  },

  conectarRed: (id) => {
    const { conectandoId, redConectadaId } = get();
    if (conectandoId !== null || redConectadaId === id) return;

    set({ conectandoId: id });

    // Simulación breve de conexión (500 ms)
    setTimeout(() => {
      set({
        conectandoId: null,
        redConectadaId: id,
      });
      platform.saveState(CLAVE_PERSISTENCIA_WIFI_RED, id);
    }, 500);
  },

  restablecer: () => {
    set({
      enLinea: true,
      calidad: undefined,
      wifiHabilitado: true,
      redConectadaId: 'casa-5g',
      conectandoId: null,
      redes: REDES_SIMULADAS_DISPONIBLES,
    });
  },
}));
