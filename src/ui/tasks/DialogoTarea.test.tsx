import { useEffect, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DialogoTarea } from './DialogoTarea';
import { TareaGestionada, Usuario } from '../../kernel/types';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';
import { MOTIVOS_ERROR_TAREAS } from '../../config/tareas';

describe('DialogoTarea', () => {
  const usuario: Usuario = {
    ...USUARIOS_SEMILLA[0],
    limites: {
      ...USUARIOS_SEMILLA[0].limites,
      appsHabilitadas: ['focuspad', 'timelapse', 'tagfs', 'burble'], // ambient bloqueada
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('crea una tarea con éxito normalizando etiqueta y título', () => {
    const onGuardar = vi.fn(() => ({
      ok: true as const,
      tarea: {} as TareaGestionada,
      tareas: [],
    }));
    const onCancelar = vi.fn();

    render(
      <DialogoTarea
        abierto={true}
        usuario={usuario}
        onGuardar={onGuardar}
        onCancelar={onCancelar}
      />
    );

    const inputTitulo = screen.getByLabelText('Título');
    expect(inputTitulo).toHaveFocus();

    const btnGuardar = screen.getByRole('button', { name: 'Guardar tarea' });
    expect(btnGuardar).toBeDisabled();

    act(() => {
      fireEvent.change(inputTitulo, { target: { value: '  Preparar presentación  ' } });
      fireEvent.click(screen.getByRole('radio', { name: '25 min' }));
      fireEvent.change(screen.getByLabelText('Etiqueta'), {
        target: { value: '#Proyecto 1' },
      });
      fireEvent.click(screen.getByRole('switch', { name: 'Importante' }));
    });

    expect(screen.getByLabelText('Etiqueta')).toHaveValue('proyecto1');
    expect(btnGuardar).toBeEnabled();

    act(() => {
      fireEvent.click(btnGuardar);
    });

    expect(onGuardar).toHaveBeenCalledWith(
      {
        titulo: 'Preparar presentación',
        app: 'focuspad',
        minutos: 25,
        etiqueta: 'proyecto1',
        importante: true,
      },
      undefined
    );
  });

  it('muestra error junto al campo con role="alert" cuando la etiqueta tiene caracteres inválidos', () => {
    const onGuardar = vi.fn();

    render(
      <DialogoTarea
        abierto={true}
        usuario={usuario}
        onGuardar={onGuardar}
        onCancelar={vi.fn()}
      />
    );

    act(() => {
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Leer notas' } });
      fireEvent.change(screen.getByLabelText('Etiqueta'), { target: { value: 'raro$!' } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      /letras, números, guiones/i
    );
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('muestra errores devueltos por onGuardar (p. ej. máximo pendientes)', () => {
    const onGuardar = vi.fn(() => ({
      ok: false as const,
      motivo: MOTIVOS_ERROR_TAREAS.MAXIMO_PENDIENTES,
    }));

    render(
      <DialogoTarea
        abierto={true}
        usuario={usuario}
        onGuardar={onGuardar}
        onCancelar={vi.fn()}
      />
    );

    act(() => {
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nueva' } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/máximo 15/i);
  });

  it('precarga los datos al editar una tarea existente', () => {
    const tarea: TareaGestionada = {
      id: 't-edit',
      usuarioId: usuario.id,
      titulo: 'Tarea previa',
      app: 'tagfs',
      minutos: 45,
      etiqueta: 'archivo',
      importante: true,
      estado: 'pendiente',
      creadaEn: 1000,
    };
    const onGuardar = vi.fn(() => ({
      ok: true as const,
      tarea,
      tareas: [tarea],
    }));

    render(
      <DialogoTarea
        abierto={true}
        usuario={usuario}
        tarea={tarea}
        onGuardar={onGuardar}
        onCancelar={vi.fn()}
      />
    );

    expect(screen.getByText('Editar tarea')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Tarea previa');
    expect(screen.getByLabelText('Etiqueta')).toHaveValue('archivo');
    expect(screen.getByRole('switch', { name: 'Importante' })).toHaveAttribute(
      'aria-checked',
      'true'
    );

    act(() => {
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Tarea editada' } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    });

    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Tarea editada' }),
      't-edit'
    );
  });

  it('muestra apps no habilitadas atenuadas con aria-disabled y no permite elegirlas', () => {
    render(
      <DialogoTarea
        abierto={true}
        usuario={usuario}
        onGuardar={vi.fn()}
        onCancelar={vi.fn()}
      />
    );

    const radioAmbient = screen.getByRole('radio', {
      name: 'Ambient: No disponible para tu perfil',
    });
    expect(radioAmbient).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/Ambient: No disponible para tu perfil/)).toBeInTheDocument();

    act(() => {
      fireEvent.click(radioAmbient);
    });
    expect(radioAmbient).toHaveAttribute('aria-checked', 'false');
  });

  it('no pierde el foco ni lo escrito al avanzar el reloj 3000 ms con re-renders del padre', () => {
    function PadreConReloj() {
      const [segundos, setSegundos] = useState(0);
      useEffect(() => {
        const id = setInterval(() => setSegundos((s) => s + 1), 1000);
        return () => clearInterval(id);
      }, []);

      return (
        <div>
          <span data-testid="reloj">{segundos}</span>
          <DialogoTarea
            abierto={true}
            usuario={usuario}
            onGuardar={vi.fn()}
            onCancelar={vi.fn()}
          />
        </div>
      );
    }

    render(<PadreConReloj />);

    const inputTitulo = screen.getByLabelText('Título');
    const inputEtiqueta = screen.getByLabelText('Etiqueta');

    act(() => {
      inputEtiqueta.focus();
      fireEvent.change(inputTitulo, { target: { value: 'Mi borrador' } });
      fireEvent.change(inputEtiqueta, { target: { value: 'tesis' } });
    });

    expect(inputEtiqueta).toHaveFocus();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('reloj')).toHaveTextContent('3');
    expect(inputEtiqueta).toHaveFocus();
    expect(inputTitulo).toHaveValue('Mi borrador');
    expect(inputEtiqueta).toHaveValue('tesis');
  });
});
