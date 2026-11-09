import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  procesarAlertasBateria,
  detenerServicioBateria,
} from './servicio';
import { useNotificaciones } from '../../store/notificaciones';
import { useRegistroStore } from '../../store/registro';

describe('procesarAlertasBateria (Servicio de Batería)', () => {
  beforeEach(() => {
    detenerServicioBateria();
    useNotificaciones.getState().reiniciar();
    useRegistroStore.getState().limpiar();
  });

  afterEach(() => {
    detenerServicioBateria();
  });

  it('no emite alertas con niveles normales superiores al 20 %', () => {
    procesarAlertasBateria(72, false);
    procesarAlertasBateria(50, false);
    procesarAlertasBateria(25, false);

    expect(useNotificaciones.getState().notificaciones).toHaveLength(0);
    expect(useRegistroStore.getState().eventos).toHaveLength(0);
  });

  it('al cruzar el 20 % emite UNA sola notificación de Burble (urgencia 3) y registra un evento de energía', () => {
    procesarAlertasBateria(20, false);

    const notifs = useNotificaciones.getState().notificaciones;
    expect(notifs).toHaveLength(1);
    expect(notifs[0].titulo).toBe('Batería baja');
    expect(notifs[0].urgencia).toBe(3);

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(1);
    expect(eventos[0].categoria).toBe('energia');
    expect(eventos[0].gravedad).toBe('aviso');
    expect(eventos[0].mensaje).toBe('Batería baja (≤ 20 %)');

    // No debe repetir si sigue en 19 % o 15 %
    procesarAlertasBateria(19, false);
    procesarAlertasBateria(15, false);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);
    expect(useRegistroStore.getState().eventos).toHaveLength(1);
  });

  it('al cruzar el 10 % emite UNA notificación de Burble (urgencia 5) y registra un evento crítico', () => {
    procesarAlertasBateria(10, false);

    const notifs = useNotificaciones.getState().notificaciones;
    expect(notifs).toHaveLength(1);
    expect(notifs[0].titulo).toBe('Batería crítica: conviene suspender');
    expect(notifs[0].urgencia).toBe(5);

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(1);
    expect(eventos[0].categoria).toBe('energia');
    expect(eventos[0].gravedad).toBe('aviso');
    expect(eventos[0].mensaje).toBe('Batería crítica (≤ 10 %)');

    // No debe repetir mientras siga <= 10 %
    procesarAlertasBateria(8, false);
    procesarAlertasBateria(5, false);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);
    expect(useRegistroStore.getState().eventos).toHaveLength(1);
  });

  it('no crea otra notificación si ya existe una equivalente sin leer', () => {
    // Simulamos una notificación ya presente sin leer
    useNotificaciones.getState().recibir({
      tipo: 'sistema',
      urgencia: 3,
      titulo: 'Batería baja',
      detalle: 'Aviso existente',
    });

    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);

    // Procesar alerta al 20 %
    procesarAlertasBateria(20, false);

    // La lista de notificaciones no debe duplicarse
    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);
  });

  it('restablece las alertas si el dispositivo se pone a cargar o supera el umbral', () => {
    procesarAlertasBateria(20, false);
    expect(useNotificaciones.getState().notificaciones).toHaveLength(1);

    // Conectar cargador
    procesarAlertasBateria(21, true);

    // Marcar como leída la notificación anterior
    const notifId = useNotificaciones.getState().notificaciones[0].id;
    useNotificaciones.getState().marcarLeidas([notifId]);

    // Desconectar cargador y volver a bajar al 20 %
    procesarAlertasBateria(20, false);

    // Ahora sí emite una nueva alerta
    expect(useNotificaciones.getState().notificaciones).toHaveLength(2);
  });
});
