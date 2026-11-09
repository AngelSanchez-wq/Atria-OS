import type { Usuario } from '../types';
import { LIMITES_USUARIO_POR_DEFECTO } from './constantes';

/**
 * Datos de prueba para desarrollo y semillas iniciales.
 * TODO: Reemplazar el PIN en texto plano por un hash con sal criptográfica segura.
 */
export const USUARIOS_SEMILLA: Usuario[] = [
  {
    id: 'valery',
    nombre: 'Valery',
    inicial: 'V',
    rol: 'estandar',
    pin: '1234',
    estado: 'activo',
    ultimoAcceso: null,
    limites: { ...LIMITES_USUARIO_POR_DEFECTO },
  },
  {
    id: 'mateo',
    nombre: 'Mateo',
    inicial: 'M',
    rol: 'estandar',
    pin: '5678',
    estado: 'bloqueado',
    ultimoAcceso: null,
    limites: { ...LIMITES_USUARIO_POR_DEFECTO },
  },
  {
    id: 'admin',
    nombre: 'Admin',
    inicial: 'A',
    rol: 'admin',
    pin: '0000',
    estado: 'activo',
    ultimoAcceso: null,
    limites: { ...LIMITES_USUARIO_POR_DEFECTO },
  },
];
