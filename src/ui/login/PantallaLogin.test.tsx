import { act, fireEvent, render, screen } from '@testing-library/react';
import { ESPERA_BLOQUEO_MS } from '../../config/login';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import { PantallaLogin } from './PantallaLogin';

function escribirPin(digitos: string) {
  for (const digito of digitos) {
    fireEvent.keyDown(window, { key: digito });
  }
}

describe('PantallaLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('al seleccionar otro usuario limpia el PIN', () => {
    render(<PantallaLogin onIngresar={() => undefined} />);

    escribirPin('12');
    expect(screen.getByRole('status', { name: '2 de 4 dígitos' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Mateo' }));

    expect(screen.getByRole('status', { name: '0 de 4 dígitos' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mateo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('con PIN incorrecto muestra aviso y descuenta un intento', () => {
    render(<PantallaLogin onIngresar={() => undefined} />);

    escribirPin('9999');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('PIN incorrecto');
    expect(screen.getByText('Quedan 2 intentos')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '0 de 4 dígitos' })).toBeInTheDocument();
  });

  it('con PIN correcto llama a onIngresar con el usuario', () => {
    const onIngresar = vi.fn();
    const mia = USUARIOS_SEMILLA[0];

    render(<PantallaLogin onIngresar={onIngresar} />);

    escribirPin(mia.pin);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onIngresar).toHaveBeenCalledTimes(1);
    expect(onIngresar).toHaveBeenCalledWith(mia);
  });

  it('al agotar intentos deshabilita el botón y restaura tras la espera', async () => {
    render(<PantallaLogin onIngresar={() => undefined} />);

    for (let i = 0; i < 3; i += 1) {
      escribirPin('9999');
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    }

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Espera un momento antes de intentarlo de nuevo',
    );
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ESPERA_BLOQUEO_MS);
    });

    expect(screen.getByText('Quedan 3 intentos')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
