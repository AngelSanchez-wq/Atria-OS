import { create } from 'zustand';
import { AppId } from '../kernel/types';

// ─── Constantes de ventana ───────────────────────────────────────────────────

export const VENTANA_ANCHO_INICIAL = 760;
export const VENTANA_ALTO_INICIAL = 520;

/** Desplazamiento en cascada para cada nueva ventana (px). */
const CASCADA_OFFSET = 30;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type EstadoVentana = 'normal' | 'minimizada' | 'maximizada';

export type DatosVentana = {
  id: string;
  appId: AppId;
  pid: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  estado: EstadoVentana;
  /** Mayor = más arriba. Se incrementa al enfocar. */
  ordenFoco: number;
};

type VentanasStore = {
  ventanas: DatosVentana[];
  /** ID de la ventana con foco actualmente. */
  focusPid: string | null;
  /** Contador global de orden de foco. */
  _contadorFoco: number;

  abrir: (appId: AppId, pid: number) => void;
  cerrar: (id: string) => void;
  minimizar: (id: string) => void;
  restaurar: (id: string) => void;
  maximizar: (id: string) => void;
  enfocar: (id: string) => void;
  mover: (id: string, x: number, y: number) => void;
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useVentanas = create<VentanasStore>((set, get) => ({
  ventanas: [],
  focusPid: null,
  _contadorFoco: 0,

  abrir: (appId, pid) => {
    const { ventanas, _contadorFoco } = get();
    const n = ventanas.filter((v) => v.estado !== 'minimizada').length;
    const nuevaVentana: DatosVentana = {
      id: `ventana-${pid}`,
      appId,
      pid,
      x: CASCADA_OFFSET * n,
      y: CASCADA_OFFSET * n,
      ancho: VENTANA_ANCHO_INICIAL,
      alto: VENTANA_ALTO_INICIAL,
      estado: 'normal',
      ordenFoco: _contadorFoco + 1,
    };
    set({
      ventanas: [...ventanas, nuevaVentana],
      focusPid: nuevaVentana.id,
      _contadorFoco: _contadorFoco + 1,
    });
  },

  cerrar: (id) => {
    set((s) => {
      const restantes = s.ventanas.filter((v) => v.id !== id);
      // Enfocar la siguiente ventana visible con mayor ordenFoco
      const siguiente = restantes
        .filter((v) => v.estado !== 'minimizada')
        .sort((a, b) => b.ordenFoco - a.ordenFoco)[0];
      return {
        ventanas: restantes,
        focusPid: siguiente?.id ?? null,
      };
    });
  },

  minimizar: (id) => {
    set((s) => {
      const restantes = s.ventanas
        .map((v) => (v.id === id ? { ...v, estado: 'minimizada' as EstadoVentana } : v));
      const siguiente = restantes
        .filter((v) => v.estado !== 'minimizada')
        .sort((a, b) => b.ordenFoco - a.ordenFoco)[0];
      return {
        ventanas: restantes,
        focusPid: siguiente?.id ?? null,
      };
    });
  },

  restaurar: (id) => {
    set((s) => {
      const nuevoContador = s._contadorFoco + 1;
      return {
        ventanas: s.ventanas.map((v) =>
          v.id === id
            ? { ...v, estado: 'normal' as EstadoVentana, ordenFoco: nuevoContador }
            : v
        ),
        focusPid: id,
        _contadorFoco: nuevoContador,
      };
    });
  },

  maximizar: (id) => {
    set((s) => {
      const nuevoContador = s._contadorFoco + 1;
      const nuevoEstado: EstadoVentana =
        s.ventanas.find((v) => v.id === id)?.estado === 'maximizada'
          ? 'normal'
          : 'maximizada';
      return {
        ventanas: s.ventanas.map((v) =>
          v.id === id ? { ...v, estado: nuevoEstado, ordenFoco: nuevoContador } : v
        ),
        focusPid: id,
        _contadorFoco: nuevoContador,
      };
    });
  },

  enfocar: (id) => {
    set((s) => {
      const nuevoContador = s._contadorFoco + 1;
      return {
        ventanas: s.ventanas.map((v) =>
          v.id === id ? { ...v, ordenFoco: nuevoContador } : v
        ),
        focusPid: id,
        _contadorFoco: nuevoContador,
      };
    });
  },

  mover: (id, x, y) => {
    set((s) => ({
      ventanas: s.ventanas.map((v) => (v.id === id ? { ...v, x, y } : v)),
    }));
  },
}));
