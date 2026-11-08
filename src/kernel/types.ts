export type RolUsuario = 'estandar' | 'admin';

export type Usuario = {
  id: string;
  nombre: string;
  inicial: string;
  rol: RolUsuario;
  pin: string;
};

export type AppId =
  | 'focuspad'
  | 'timelapse'
  | 'tagfs'
  | 'burble'
  | 'ambient'
  | 'monitor';

export type Tarea = {
  id: string;
  titulo: string;
  app: AppId;
  minutos: number;
  etiqueta: string;
};

export type EstadoProceso =
  | 'Nuevo'
  | 'Listo'
  | 'En ejecución'
  | 'Bloqueado'
  | 'Pausado'
  | 'Terminado';

export type TipoApp = 'web' | 'local' | 'interna';

/** Process Control Block: registro de cada proceso vivo en el kernel simulado. */
export type PCB = {
  pid: number;
  nombre: string;
  estado: EstadoProceso;
  /** 1 (baja) – 10 (alta). */
  prioridad: number;
  memoriaMb: number;
  usuarioId: string;
  /** Timestamp epoch en ms. Sin Date aquí: el kernel es TypeScript puro. */
  creadoEn: number;
  tipoApp: TipoApp;
  url?: string;
};

export type TipoNotificacion = 'sistema' | 'mensajes' | 'recordatorios' | 'alertas';

export type EstadoNotificacion = 'retenida' | 'entregada' | 'leida';

export type NivelUrgencia = 'urgente' | 'normal' | 'baja';

export type DecisionEntrega = 'inmediata' | 'retener';

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  /** Escala de 1 (baja) a 5 (urgente). */
  urgencia: number;
  titulo: string;
  /** Frase corta descriptiva opcional. */
  detalle?: string;
  /** Timestamp epoch en ms. Sin Date: kernel puro. */
  creadaEn: number;
  estado: EstadoNotificacion;
};

export type EstadoSegmentoRevision =
  | 'revisada'
  | 'actual'
  | 'pendiente'
  | 'pendiente-urgente'
  | 'pospuesta';

export type SegmentoRevision = {
  id: string;
  estado: EstadoSegmentoRevision;
};

export type EstadoProgresoRevision = {
  revisadas: number;
  total: number;
};
