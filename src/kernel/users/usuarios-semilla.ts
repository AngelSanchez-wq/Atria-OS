import type { Usuario } from '../types';
import { LIMITES_USUARIO_POR_DEFECTO } from './constantes';

/**
 * Datos de prueba para desarrollo.
 * TODO: Reemplazar el PIN en texto plano por un hash criptográfico con sal en una futura entrega.
 * NUNCA registrar ni mostrar el PIN en registros o vistas.
 */
export const USUARIOS_SEMILLA: Usuario[] = [
  {
    id: 'mia',
    nombre: 'Mia',
    inicial: 'M',
    rol: 'estandar',
    pin: '1234',
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      appsHabilitadas: [...LIMITES_USUARIO_POR_DEFECTO.appsHabilitadas],
      maxTareasActivas: LIMITES_USUARIO_POR_DEFECTO.maxTareasActivas,
      memoriaMaximaMb: LIMITES_USUARIO_POR_DEFECTO.memoriaMaximaMb,
    },
  },
  {
    id: 'mateo',
    nombre: 'Mateo',
    inicial: 'M',
    rol: 'estandar',
    pin: '5678',
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      appsHabilitadas: [...LIMITES_USUARIO_POR_DEFECTO.appsHabilitadas],
      maxTareasActivas: LIMITES_USUARIO_POR_DEFECTO.maxTareasActivas,
      memoriaMaximaMb: LIMITES_USUARIO_POR_DEFECTO.memoriaMaximaMb,
    },
  },
  {
    id: 'admin',
    nombre: 'Admin',
    inicial: 'A',
    rol: 'admin',
    pin: '0000',
    estado: 'activo',
    ultimoAcceso: null,
    limites: {
      appsHabilitadas: [...LIMITES_USUARIO_POR_DEFECTO.appsHabilitadas],
      maxTareasActivas: LIMITES_USUARIO_POR_DEFECTO.maxTareasActivas,
      memoriaMaximaMb: LIMITES_USUARIO_POR_DEFECTO.memoriaMaximaMb,
    },
  },
];
