import { useRegistroStore } from '../../store/registro';
import { crearEvento, ParamsCrearEvento } from '../../kernel/logs/eventos';
import { EventoSistema } from '../../kernel/logs/types';

/**
 * Servicio centralizado de registro de eventos del sistema.
 *
 * Justificación de diseño:
 * 1. Proporciona una función simple `registrar(...)` para emitir eventos desde
 *    cualquier módulo (login, procesos, energía, monitor, UI) en una sola línea.
 * 2. Desacopla a los emisores de los detalles de almacenamiento, filtrado y persistencia.
 * 3. Evita dependencias circulares entre stores del sistema (sesión, procesos, energía,
 *    notificaciones), ya que el flujo hacia el registro es estrictamente unidireccional.
 */
export function registrar(params: ParamsCrearEvento): EventoSistema {
  const evento = crearEvento(params);
  useRegistroStore.getState().agregar(evento);
  return evento;
}

export function obtenerEventos(): EventoSistema[] {
  return useRegistroStore.getState().eventos;
}

export function limpiarRegistro(): void {
  useRegistroStore.getState().limpiar();
}
