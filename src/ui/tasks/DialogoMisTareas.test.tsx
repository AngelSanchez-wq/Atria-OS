import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DialogoMisTareas } from './DialogoMisTareas';
import { useTareas } from '../../store/tareas';
import { useSesion } from '../../store/sesion';
import { useUsuariosStore } from '../../store/usuarios';
import { TareaGestionada, Usuario } from '../../kernel/types';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

describe('DialogoMisTareas', () => {
  const valery: Usuario = USUARIOS_SEMILLA[0];

  const tareaPendiente: TareaGestionada = {
    id: 't1',
    usuarioId: valery.id,
    titulo: 'Escribir informe',
    app: 'focuspad',
    minutos: 15,
    etiqueta: 'estudio',
    importante: true,
    estado: 'pendiente',
    creadaEn: 100,
  };

  const tareaEnCurso: TareaGestionada = {
    id: 't2',
    usuarioId: valery.id,
    titulo: 'Revisar notas',
    app: 'tagfs',
    minutos: 25,
    etiqueta: 'proyecto',
    importante: false,
    estado: 'en-curso',
    creadaEn: 200,
  };

  beforeEach(() => {
    localStorage.clear();
    useUsuariosStore.getState().restablecer();
    useSesion.setState({ usuario: valery });
    useTareas.setState({
      tareaActiva: tareaEnCurso,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: [tareaPendiente],
      ultimaTerminada: null,
      enLogro: false,
      iniciada: true,
      tareasPorUsuario: {
        [valery.id]: [tareaPendiente, tareaEnCurso],
      },
      inicializadas: { [valery.id]: true },
      sugerenciaActualId: null,
    });
  });

  it('lista tareas, muestra marcas y bloquea edición/eliminación de la tarea en curso', () => {
    render(
      <DialogoMisTareas abierto={true} usuario={valery} onCerrar={vi.fn()} />
    );

    expect(screen.getByText('Escribir informe')).toBeInTheDocument();
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Revisar notas')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(
      screen.getByText('Las tareas importantes se sugieren primero.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Editar Revisar notas' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Eliminar Revisar notas' })
    ).toBeDisabled();
  });

  it('permite editar una tarea pendiente', () => {
    render(
      <DialogoMisTareas abierto={true} usuario={valery} onCerrar={vi.fn()} />
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Editar Escribir informe' }));
    });

    expect(screen.getByText('Editar tarea')).toBeInTheDocument();
    act(() => {
      fireEvent.change(screen.getByLabelText('Título'), {
        target: { value: 'Informe final' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    });

    expect(screen.getByText('Informe final')).toBeInTheDocument();
    expect(screen.getByText('Tarea guardada')).toBeInTheDocument();
  });

  it('elimina una tarea tras confirmar en el diálogo', () => {
    render(
      <DialogoMisTareas abierto={true} usuario={valery} onCerrar={vi.fn()} />
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar Escribir informe' }));
    });

    expect(screen.getByText('¿Eliminar esta tarea?')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    });

    expect(screen.queryByText('Escribir informe')).not.toBeInTheDocument();
    expect(screen.getByText('Tarea eliminada')).toBeInTheDocument();
  });

  it('muestra aviso de app no disponible si se abre una tarea cuya app fue deshabilitada', () => {
    const valerySinFocuspad: Usuario = {
      ...valery,
      limites: {
        ...valery.limites,
        appsHabilitadas: ['tagfs'],
      },
    };
    useSesion.setState({ usuario: valerySinFocuspad });

    render(
      <DialogoMisTareas
        abierto={true}
        usuario={valerySinFocuspad}
        onCerrar={vi.fn()}
      />
    );

    act(() => {
      fireEvent.click(screen.getByText('Escribir informe'));
    });

    expect(screen.getByText('FocusPad no está disponible')).toBeInTheDocument();
    expect(
      screen.getByText('El administrador la desactivó para tu perfil.')
    ).toBeInTheDocument();
  });
});
