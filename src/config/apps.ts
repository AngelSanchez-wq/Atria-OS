import { AppId } from '../kernel/types';

export type ModoApp = 'ventana' | 'interna';
export type FallbackApp = 'pestana';

export type InfoApp = {
  nombre: string;
  rutaLogo: string;
  modo: ModoApp;
  /** URL para apps externas/locales. Interna = undefined. */
  url?: string;
  /** Si true, muestra aviso cuando no haya conexión. */
  necesitaInternet?: boolean;
  /** Cómo abrir si el iframe falla (apps externas). */
  fallback?: FallbackApp;
  /** Si true, la app solo es visible y accesible para administradores. */
  soloAdmin?: boolean;
};

// ─── URLs como constantes con nombre ────────────────────────────────────────

const URL_ZENPEN = 'https://zenpen.io/';
const URL_POMOFOCUS = 'https://pomofocus.io/';
/** Ruta relativa a la raíz pública del proyecto, construida en runtime con BASE_URL. */
export const RUTA_TAGFS = 'apps/tareas/task-manager.html';

// ─── Tabla de apps ───────────────────────────────────────────────────────────

export const APPS: Record<AppId, InfoApp> = {
  focuspad: {
    nombre: 'FocusPad',
    rutaLogo: 'icons/focuspad.svg',
    modo: 'ventana',
    url: URL_ZENPEN,
    necesitaInternet: true,
    fallback: 'pestana',
  },
  timelapse: {
    nombre: 'TimeLapse',
    rutaLogo: 'icons/timelapse.svg',
    modo: 'ventana',
    url: URL_POMOFOCUS,
    necesitaInternet: true,
    fallback: 'pestana',
  },
  tagfs: {
    nombre: 'TagFS',
    rutaLogo: 'icons/tagfs.svg',
    modo: 'ventana',
    // La URL completa se construye en runtime: `${import.meta.env.BASE_URL}${RUTA_TAGFS}`
    url: RUTA_TAGFS,
    necesitaInternet: false,
    fallback: 'pestana',
  },
  burble: {
    nombre: 'Burble',
    rutaLogo: 'icons/burble.svg',
    modo: 'interna',
  },
  ambient: {
    nombre: 'Ambient',
    rutaLogo: 'icons/ambient.svg',
    modo: 'interna',
  },
  monitor: {
    nombre: 'Monitor de procesos',
    rutaLogo: 'icons/monitor.svg',
    modo: 'interna',
    soloAdmin: true,
  },
};
