import { AppId } from '../kernel/types';

export type InfoApp = {
  nombre: string;
  rutaLogo: string;
};

export const APPS: Record<AppId, InfoApp> = {
  focuspad: {
    nombre: 'FocusPad',
    rutaLogo: 'icons/focuspad.svg',
  },
  timelapse: {
    nombre: 'TimeLapse',
    rutaLogo: 'icons/timelapse.svg',
  },
  tagfs: {
    nombre: 'TagFS',
    rutaLogo: 'icons/tagfs.svg',
  },
  burble: {
    nombre: 'Burble',
    rutaLogo: 'icons/burble.svg',
  },
  ambient: {
    nombre: 'Ambient',
    rutaLogo: 'icons/ambient.svg',
  },
};
