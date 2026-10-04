import type { Usuario } from '../types';

/**
 * Datos de prueba para desarrollo.
 * El PIN en texto plano es temporal: se reemplazará por un hash con sal.
 */
export const USUARIOS_SEMILLA: Usuario[] = [
  {
    id: 'mia',
    nombre: 'Mia',
    inicial: 'M',
    rol: 'estandar',
    pin: '1234',
  },
  {
    id: 'mateo',
    nombre: 'Mateo',
    inicial: 'M',
    rol: 'estandar',
    pin: '5678',
  },
  {
    id: 'admin',
    nombre: 'Admin',
    inicial: 'A',
    rol: 'admin',
    pin: '0000',
  },
];
