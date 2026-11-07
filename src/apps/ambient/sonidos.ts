import { CloudRain, Trees, Moon, Waves, type LucideIcon } from 'lucide-react';

export type SonidoId = 'lluvia' | 'bosque' | 'noche' | 'arroyo';

export type InfoSonido = {
  id: SonidoId;
  nombre: string;
  archivo: string;
  icono: LucideIcon;
};

export const SONIDOS_AMBIENT: InfoSonido[] = [
  {
    id: 'lluvia',
    nombre: 'Lluvia',
    archivo: 'sounds/lluvia.mp3',
    icono: CloudRain,
  },
  {
    id: 'bosque',
    nombre: 'Bosque',
    archivo: 'sounds/bosque.mp3',
    icono: Trees,
  },
  {
    id: 'noche',
    nombre: 'Noche',
    archivo: 'sounds/noche.mp3',
    icono: Moon,
  },
  {
    id: 'arroyo',
    nombre: 'Arroyo',
    archivo: 'sounds/arroyo.mp3',
    icono: Waves,
  },
];
