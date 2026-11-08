import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Burble } from './Burble';
import { useNotificaciones, seleccionarSinLeer } from '../../store/notificaciones';
import { useTareas } from '../../store/tareas';
import { DURACION_LOGRO_MS } from '../../config/logro';
import { CLASE_CONTENEDOR_BURBLE, CLASE_ANILLO_LOGRO_RESPONSIVO } from '../../config/revision';

describe('App Burble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNotificaciones.getState().reiniciar();
    useTareas.setState({
      tareaActiva: null,
      estado: 'en-curso',
      segundosTranscurridos: 0,
      pendientes: [],
      ultimaTerminada: null,
      enLogro: false,
      iniciada: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el estado vacío con el búho en reposo cuando no hay notificaciones', () => {
    render(<Burble />);

    expect(screen.getByText('Todo al día.')).toBeInTheDocument();
    expect(screen.getByText('No tienes notificaciones pendientes.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Atria-OS, en reposo' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Atria-OS, en foco' })).not.toBeInTheDocument();
  });

  it('muestra la vista resumen con grupos y contadores cuando hay notificaciones', () => {
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta crítica',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje de Mateo',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 4,
      titulo: 'Mensaje de Mia',
    });
    useNotificaciones.getState().recibir({
      tipo: 'sistema',
      urgencia: 2,
      titulo: 'Actualización disponible',
    });

    render(<Burble />);

    // Grupos visibles
    expect(screen.getByRole('region', { name: 'Notificaciones urgente' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Notificaciones normal' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Notificaciones baja' })).toBeInTheDocument();

    // Contadores accesibles
    expect(screen.getByRole('listitem', { name: '1 alertas' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '2 mensajes' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '1 sistema' })).toBeInTheDocument();

    // Botón Revisar ahora habilitado
    const botonRevisar = screen.getByRole('button', { name: 'Revisar ahora' });
    expect(botonRevisar).toBeEnabled();

    // No debe mostrar el búho de foco
    expect(screen.queryByRole('img', { name: 'Atria-OS, en foco' })).not.toBeInTheDocument();
  });

  it('oculta los grupos que no tienen notificaciones', () => {
    useNotificaciones.getState().recibir({
      tipo: 'sistema',
      urgencia: 2,
      titulo: 'Actualización del kernel',
    });

    render(<Burble />);

    expect(screen.getByRole('region', { name: 'Notificaciones baja' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Notificaciones urgente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Notificaciones normal' })).not.toBeInTheDocument();
  });

  it('inicia revisión una por una mostrando una sola tarjeta con anillo segmentado y avanza con Entendido', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje 1',
      detalle: 'Detalle de mensaje 1',
    });
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta urgente',
      detalle: 'Detalle urgente',
    });

    render(<Burble />);

    // Iniciar revisión
    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));

    // La urgente va primero en la cola
    expect(screen.getByRole('region', { name: 'Revisión de notificaciones' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /Alerta urgente/ })).toBeInTheDocument();
    expect(screen.getByText('Detalle urgente')).toBeInTheDocument();

    // Solo se muestra UNA tarjeta (la actual)
    const articulos = screen.getAllByRole('article');
    expect(articulos).toHaveLength(1);

    // Anillo muestra "1/2" y "0 revisadas"
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('0 revisadas')).toBeInTheDocument();

    // Pulsar "Entendido" en la primera tarjeta
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    // Ahora se muestra la segunda tarjeta
    expect(screen.getByRole('article', { name: /Mensaje 1/ })).toBeInTheDocument();
    expect(screen.getByText('Detalle de mensaje 1')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('1 revisadas')).toBeInTheDocument();
  });

  it('permite posponer una tarjeta con Más tarde y enviarla al final', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Tarjeta A',
    });
    useNotificaciones.getState().recibir({
      tipo: 'sistema',
      urgencia: 2,
      titulo: 'Tarjeta B',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    expect(screen.getByRole('article', { name: /Tarjeta A/ })).toBeInTheDocument();

    // Pulsar "Más tarde"
    fireEvent.click(screen.getByRole('button', { name: 'Más tarde' }));

    // Avanza a Tarjeta B
    expect(screen.getByRole('article', { name: /Tarjeta B/ })).toBeInTheDocument();
  });

  it('permite avanzar con los atajos de teclado Enter (Entendido) y M (Más tarde)', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Notif 1',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Notif 2',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    expect(screen.getByRole('article', { name: /Notif 1/ })).toBeInTheDocument();

    // Presionar tecla M (Más tarde)
    fireEvent.keyDown(window, { key: 'm' });

    // Avanza a Notif 2
    expect(screen.getByRole('article', { name: /Notif 2/ })).toBeInTheDocument();

    // Presionar tecla Enter (Entendido)
    fireEvent.keyDown(window, { key: 'Enter' });

    // Notif 2 quedó leída y solo queda Notif 1 pospuesta -> Estado fin con pendientes
    expect(screen.getByText('Revisión terminada')).toBeInTheDocument();
  });

  it('Volver al resumen cierra la revisión sin marcar como leídas las tarjetas restantes', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Mensaje pendiente',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    expect(screen.getByRole('article', { name: /Mensaje pendiente/ })).toBeInTheDocument();

    // Clic en "Volver al resumen"
    fireEvent.click(screen.getByRole('button', { name: 'Volver al resumen' }));

    // Regresa a la vista resumen
    expect(screen.getByRole('region', { name: 'Resumen de notificaciones de Burble' })).toBeInTheDocument();

    // La notificación sigue sin leer
    expect(useNotificaciones.getState().contarSinLeer()).toBe(1);
  });

  it('muestra la pantalla de logro (con anillo 20 % mayor y búho logro) cuando todo fue leído', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Única notificación',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    // Estado de logro
    expect(screen.getByText('Lote revisado')).toBeInTheDocument();
    expect(screen.getByText('Todo al día.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tarea completada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument();

    // El anillo tiene la clase de tamaño 20 % mayor
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.className).toContain(CLASE_ANILLO_LOGRO_RESPONSIVO);

    // Pulsar "Listo" pasa directamente al estado vacío
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText('Todo al día.')).toBeInTheDocument();
    expect(screen.getByText('No tienes notificaciones pendientes.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Atria-OS, en reposo' })).toBeInTheDocument();
  });

  it('cierra automáticamente la pantalla de logro tras DURACION_LOGRO_MS', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Notif',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(screen.getByText('Lote revisado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(DURACION_LOGRO_MS);
    });

    expect(screen.getByText('Todo al día.')).toBeInTheDocument();
    expect(screen.getByText('No tienes notificaciones pendientes.')).toBeInTheDocument();
  });

  it('muestra la pantalla de fin con pendientes cuando quedan tarjetas pospuestas, sin búho de logro', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Notif A',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: 'Notif B',
    });

    render(<Burble />);

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));

    // Pospone A y lee B
    fireEvent.click(screen.getByRole('button', { name: 'Más tarde' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    // Pantalla fin con pendientes
    expect(screen.getByText('Revisión terminada')).toBeInTheDocument();
    expect(screen.getByText(/Quedan 1 para más tarde/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seguir con ellas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();

    // NO debe haber búho de logro
    expect(screen.queryByRole('img', { name: 'Tarea completada' })).not.toBeInTheDocument();

    // Pulsar "Seguir con ellas" reanuda la revisión con la pospuesta
    fireEvent.click(screen.getByRole('button', { name: 'Seguir con ellas' }));
    expect(screen.getByRole('article', { name: /Notif A/ })).toBeInTheDocument();
  });

  it('el búho de foco nunca aparece en ninguna vista de Burble', () => {
    useNotificaciones.getState().recibir({
      tipo: 'alertas',
      urgencia: 5,
      titulo: 'Alerta',
    });

    render(<Burble />);
    expect(screen.queryByRole('img', { name: 'Atria-OS, en foco' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));
    expect(screen.queryByRole('img', { name: 'Atria-OS, en foco' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('img', { name: 'Atria-OS, en foco' })).not.toBeInTheDocument();
  });

  it('la campana de notificaciones refleja el contador exacto de no leídas', () => {
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: '1',
    });
    useNotificaciones.getState().recibir({
      tipo: 'mensajes',
      urgencia: 3,
      titulo: '2',
    });

    expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(2);

    render(<Burble />);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar ahora' }));

    // Posponer la primera: sigue sin leer
    fireEvent.click(screen.getByRole('button', { name: 'Más tarde' }));
    expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(2);

    // Leer la segunda: se descuenta a 1
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(seleccionarSinLeer(useNotificaciones.getState())).toBe(1);
  });

  it('utiliza la clase de contenedor de container queries para tamaños responsivos', () => {
    const { container } = render(<Burble />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain(CLASE_CONTENEDOR_BURBLE);
  });
});

/**
 * NOTA: Dado que jsdom no calcula layout real ni container queries (cqmin, cqw),
 * las dimensiones responsivas y el escalado fluido en pantallas maximizadas
 * deben verificarse visualmente en el navegador.
 */
