import { create } from 'zustand';
import { EventoSistema } from '../kernel/logs/types';
import { MAXIMO_EVENTOS_REGISTRO } from '../kernel/logs/constantes';
import { agregarEvento } from '../kernel/logs/eventos';
import { platform } from '../platform/web';

export const CLAVE_PERSISTENCIA_REGISTRO = 'atria_registro_eventos';

export type RegistroStore = {
  eventos: EventoSistema[];
  agregar: (evento: EventoSistema) => void;
  limpiar: () => void;
};

// Carga inicial persistida respetando el límite máximo
const eventosPersistidos = platform.loadState<EventoSistema[]>(
  CLAVE_PERSISTENCIA_REGISTRO,
  []
);

const eventosIniciales = Array.isArray(eventosPersistidos)
  ? eventosPersistidos.slice(Math.max(0, eventosPersistidos.length - MAXIMO_EVENTOS_REGISTRO))
  : [];

export const useRegistroStore = create<RegistroStore>((set) => ({
  eventos: eventosIniciales,

  agregar: (evento) => {
    set((state) => {
      const nuevaLista = agregarEvento(state.eventos, evento, MAXIMO_EVENTOS_REGISTRO);
      platform.saveState(CLAVE_PERSISTENCIA_REGISTRO, nuevaLista);
      return { eventos: nuevaLista };
    });
  },

  limpiar: () => {
    platform.saveState(CLAVE_PERSISTENCIA_REGISTRO, []);
    set({ eventos: [] });
  },
}));
