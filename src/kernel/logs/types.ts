export type CategoriaEvento = 'sesion' | 'seguridad' | 'proceso' | 'energia';

export type GravedadEvento = 'info' | 'aviso';

export type EventoSistema = {
  id: string;
  instante: number;
  categoria: CategoriaEvento;
  gravedad: GravedadEvento;
  mensaje: string;
  usuarioId?: string;
};
