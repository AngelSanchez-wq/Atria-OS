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
