import { TipoNotificacion } from '../../kernel/types';

export type NotificacionSemilla = {
  tipo: TipoNotificacion;
  urgencia: number;
  titulo: string;
};

/**
 * Notificaciones semilla de ejemplo en español con títulos cortos y variedad de tipos y urgencias.
 */
export const NOTIFICACIONES_SEMILLA: readonly NotificacionSemilla[] = [
  {
    tipo: 'mensajes',
    urgencia: 4,
    titulo: 'Mateo te escribió',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Recordatorio: revisar el informe',
  },
  {
    tipo: 'sistema',
    urgencia: 2,
    titulo: 'Actualización disponible',
  },
  {
    tipo: 'mensajes',
    urgencia: 3,
    titulo: 'Nuevo mensaje en el grupo',
  },
  {
    tipo: 'alertas',
    urgencia: 2,
    titulo: 'Batería al 70 %',
  },
  {
    tipo: 'alertas',
    urgencia: 5,
    titulo: 'Alerta importante',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Pausa para descansar la vista',
  },
  {
    tipo: 'sistema',
    urgencia: 1,
    titulo: 'Sincronización completada',
  },
  {
    tipo: 'mensajes',
    urgencia: 4,
    titulo: 'Mia compartió un documento',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Reunión semanal en 30 minutos',
  },
];
