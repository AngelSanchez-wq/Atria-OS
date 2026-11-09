export type RolUsuario = 'estandar' | 'admin';
export type EstadoUsuario = 'activo' | 'bloqueado';

export type AppId =
  | 'focuspad'
  | 'timelapse'
  | 'tagfs'
  | 'burble'
  | 'ambient'
  | 'monitor'
  | 'configuracion';

export type IdApp = AppId;

export type LimitesUsuario = {
  appsHabilitadas: IdApp[];
  maxTareasActivas: number;
  memoriaMaximaMb: number;
};

export type Usuario = {
  id: string;
  nombre: string;
  inicial: string;
  rol: RolUsuario;
  pin: string;
  estado: EstadoUsuario;
  ultimoAcceso: number | null;
  limites: LimitesUsuario;
  foto?: string;
};

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

/**
 * Process Control Block (PCB): registro de cada proceso vivo en el kernel simulado.
 * 
 * NOTA: El estado del proceso ('En ejecución', 'Listo', 'Pausado', etc.) es una simulación
 * del planificador del sistema operativo con fines didácticos y de monitoreo; no suspende
 * ni detiene la ejecución real de las aplicaciones web en el navegador (audio, timers, iframes).
 */
export type PCB = {
  pid: number;
  nombre: string;
  estado: EstadoProceso;
  /** Prioridad base estática 1 (baja) – 10 (alta). */
  prioridad: number;
  /** Prioridad efectiva dinámica (base + bonificación por envejecimiento + foco, máx 10). */
  prioridadEfectiva?: number;
  /** Cantidad de ticks simulados transcurridos esperando en cola de Listos. */
  ticksEsperando?: number;
  /** Ticks de CPU restantes antes de ceder el turno por Round Robin. */
  quantumRestante?: number;
  /** Total acumulado de ticks que el proceso ha sido ejecutado en CPU. */
  ticksEnCpu?: number;
  memoriaMb: number;
  usuarioId: string;
  /** Timestamp epoch en ms. Sin Date aquí: el kernel es TypeScript puro. */
  creadoEn: number;
  tipoApp: TipoApp;
  url?: string;
  /** Indica si es un proceso de demostración creado por el planificador. */
  esDemo?: boolean;
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
