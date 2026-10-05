export type RolUsuario = 'estandar' | 'admin';

export type Usuario = {
  id: string;
  nombre: string;
  inicial: string;
  rol: RolUsuario;
  pin: string;
};

export type AppId = 'focuspad' | 'timelapse' | 'tagfs' | 'burble' | 'ambient';

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
