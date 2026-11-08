import { verificarPin } from './verificarPin';
import { USUARIOS_SEMILLA } from './usuarios-semilla';

const usuarioPrueba = USUARIOS_SEMILLA[0];

describe('verificarPin', () => {
  it('acepta el PIN correcto', () => {
    expect(verificarPin(usuarioPrueba, '1234')).toBe(true);
  });

  it('rechaza el PIN incorrecto', () => {
    expect(verificarPin(usuarioPrueba, '9999')).toBe(false);
  });
});
