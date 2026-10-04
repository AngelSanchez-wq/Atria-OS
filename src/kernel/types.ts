export type RolUsuario = 'estandar' | 'admin';

export type Usuario = {
  id: string;
  nombre: string;
  inicial: string;
  rol: RolUsuario;
  pin: string;
};
