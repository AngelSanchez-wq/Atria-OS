import { TipoNotificacion } from '../../kernel/types';

export type NotificacionSemilla = {
  tipo: TipoNotificacion;
  urgencia: number;
  titulo: string;
  detalle?: string;
};

/**
 * Notificaciones semilla de ejemplo en español con títulos cortos y variedad de tipos y urgencias.
 */
export const NOTIFICACIONES_SEMILLA: readonly NotificacionSemilla[] = [
  {
    tipo: 'mensajes',
    urgencia: 4,
    titulo: 'Mateo te escribió',
    detalle: '¿Podemos revisar la presentación del sprint hoy?',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Recordatorio: revisar el informe',
    detalle: 'Entrega final requerida antes del cierre del día',
  },
  {
    tipo: 'sistema',
    urgencia: 2,
    titulo: 'Actualización disponible',
    detalle: 'Versión 0.2.0 lista para instalar',
  },
  {
    tipo: 'mensajes',
    urgencia: 3,
    titulo: 'Nuevo mensaje en el grupo',
    detalle: 'Ana comentó en el canal general de desarrollo',
  },
  {
    tipo: 'alertas',
    urgencia: 2,
    titulo: 'Batería al 70 %',
    detalle: 'Aproximadamente 4 horas de uso estimadas',
  },
  {
    tipo: 'alertas',
    urgencia: 5,
    titulo: 'Alerta importante',
    detalle: 'Revisión prioritaria de tiempo asignado',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Pausa para descansar la vista',
    detalle: 'Llevas 50 minutos de trabajo continuo enfocado',
  },
  {
    tipo: 'sistema',
    urgencia: 1,
    titulo: 'Sincronización completada',
    detalle: 'Todos tus cambios locales están al día',
  },
  {
    tipo: 'mensajes',
    urgencia: 4,
    titulo: 'Mia compartió un documento',
    detalle: 'Especificación de arquitectura de Atria-OS',
  },
  {
    tipo: 'recordatorios',
    urgencia: 3,
    titulo: 'Reunión semanal en 30 minutos',
    detalle: 'Enlace en la sala virtual del equipo',
  },
];
