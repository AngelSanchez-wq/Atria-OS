import { verificarPin } from './verificarPin';
import type { Usuario } from '../types';

const usuarioPrueba: Usuario = {
  id: 'mia',
  nombre: 'Mia',
  inicial: 'M',
  rol: 'estandar',
  pin: '1234',
};

describe('verificarPin', () => {
  it('acepta el PIN correcto', () => {
    expect(verificarPin(usuarioPrueba, '1234')).toBe(true);
  });

  it('rechaza el PIN incorrecto', () => {
    expect(verificarPin(usuarioPrueba, '9999')).toBe(false);
  });
});
