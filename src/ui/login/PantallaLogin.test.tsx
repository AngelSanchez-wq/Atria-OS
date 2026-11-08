import { act, fireEvent, render, screen } from '@testing-library/react';
import { ESPERA_BLOQUEO_MS } from '../../config/login';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import { useRegistroStore } from '../../store/registro';
import { PantallaLogin } from './PantallaLogin';

function escribirPin(digitos: string) {
  for (const digito of digitos) {
    fireEvent.keyDown(window, { key: digito });
  }
}

describe('PantallaLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRegistroStore.getState().limpiar();
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

  it('con PIN incorrecto muestra aviso y descuenta un intento, registrando aviso de seguridad sin PIN', () => {
    render(<PantallaLogin onIngresar={() => undefined} />);

    escribirPin('9999');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('PIN incorrecto');
    expect(screen.getByText('Quedan 2 intentos')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '0 de 4 dígitos' })).toBeInTheDocument();

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(1);
    expect(eventos[0].categoria).toBe('seguridad');
    expect(eventos[0].gravedad).toBe('aviso');
    expect(eventos[0].mensaje).toContain('PIN incorrecto para Mia (2 intentos restantes)');
    expect(eventos[0].mensaje).not.toContain('9999');
  });

  it('con PIN correcto llama a onIngresar con el usuario y registra evento de sesión sin PIN', () => {
    const onIngresar = vi.fn();
    const mia = USUARIOS_SEMILLA[0];

    render(<PantallaLogin onIngresar={onIngresar} />);

    escribirPin(mia.pin);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onIngresar).toHaveBeenCalledTimes(1);
    expect(onIngresar).toHaveBeenCalledWith(mia);

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos).toHaveLength(1);
    expect(eventos[0].categoria).toBe('sesion');
    expect(eventos[0].gravedad).toBe('info');
    expect(eventos[0].mensaje).toContain('Inicio de sesión correcto de Mia');
    expect(eventos[0].mensaje).not.toContain(mia.pin);
  });

  it('al agotar intentos deshabilita el botón, restaura tras la espera y registra aviso de bloqueo sin PIN', async () => {
    render(<PantallaLogin onIngresar={() => undefined} />);

    for (let i = 0; i < 3; i += 1) {
      escribirPin('9999');
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    }

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Espera un momento antes de intentarlo de nuevo',
    );
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();

    const eventos = useRegistroStore.getState().eventos;
    expect(eventos.length).toBe(4);
    const eventoBloqueo = eventos.find((e) => e.mensaje.includes('Bloqueo por intentos agotados'));
    expect(eventoBloqueo).toBeDefined();
    expect(eventoBloqueo?.categoria).toBe('seguridad');
    expect(eventoBloqueo?.gravedad).toBe('aviso');

    for (const ev of eventos) {
      expect(ev.mensaje).not.toContain('9999');
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ESPERA_BLOQUEO_MS);
    });

    expect(screen.getByText('Quedan 3 intentos')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('una cuenta bloqueada no puede iniciar sesión aunque el PIN sea correcto', () => {
    const onIngresar = vi.fn();
    const usuarioBloqueado = {
      ...USUARIOS_SEMILLA[0],
      estado: 'bloqueado' as const,
    };

    render(
      <PantallaLogin
        onIngresar={onIngresar}
        usuarios={[usuarioBloqueado]}
      />
    );

    escribirPin(usuarioBloqueado.pin);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onIngresar).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Esta cuenta está bloqueada');
  });
});
