import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PanelPlanificador } from './PanelPlanificador';
import { usePlanificador } from '../../store/planificador';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { PCB } from '../../kernel/types';

function crearPcbMock(datos: Partial<PCB> & { pid: number; nombre: string }): PCB {
  return {
    pid: datos.pid,
    nombre: datos.nombre,
    estado: datos.estado ?? 'Listo',
    prioridad: datos.prioridad ?? 5,
    prioridadEfectiva: datos.prioridadEfectiva ?? datos.prioridad ?? 5,
    ticksEsperando: datos.ticksEsperando ?? 0,
    quantumRestante: datos.quantumRestante ?? 3,
    ticksEnCpu: datos.ticksEnCpu ?? 0,
    memoriaMb: datos.memoriaMb ?? 32,
    usuarioId: datos.usuarioId ?? 'usuario-test',
    creadoEn: datos.creadoEn ?? 1000,
    tipoApp: datos.tipoApp ?? 'interna',
    esDemo: datos.esDemo,
  };
}

describe('PanelPlanificador', () => {
  beforeEach(() => {
    usePlanificador.getState().restablecer();
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra las tres tarjetas de resumen con algoritmo, cambios de contexto y tiempo simulado', () => {
    usePlanificador.setState({
      ticks: 155, // 02:35
      cambiosContexto: 14,
    });

    render(<PanelPlanificador />);

    expect(
      screen.getByText('Algoritmo: Round Robin con prioridades')
    ).toBeInTheDocument();
    expect(screen.getByText('Cambios de contexto: 14')).toBeInTheDocument();
    expect(screen.getByText('Tiempo simulado: 02:35')).toBeInTheDocument();
  });

  it('muestra la tarjeta de Procesador libre cuando la CPU está ociosa', () => {
    usePlanificador.setState({ procesoEnCpuPid: null });

    render(<PanelPlanificador />);

    expect(screen.getByText('Procesador libre')).toBeInTheDocument();
    expect(
      screen.getByText('No hay procesos compitiendo por CPU en este momento.')
    ).toBeInTheDocument();
    expect(screen.getByText('Libre')).toBeInTheDocument();
  });

  it('muestra el proceso en CPU con su PID, prioridad efectiva, quantum y barra de progreso', () => {
    const p1 = crearPcbMock({
      pid: 3,
      nombre: 'focuspad',
      estado: 'En ejecución',
      prioridad: 5,
      prioridadEfectiva: 7,
      quantumRestante: 2, // quantum total = 3, ticks consumidos = 1 (Turno 1 de 3)
    });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, p1] });
    usePlanificador.setState({ procesoEnCpuPid: 3 });

    render(<PanelPlanificador />);

    expect(screen.getByText('FocusPad')).toBeInTheDocument();
    expect(screen.getByText('PID 3 · Prioridad 7')).toBeInTheDocument();
    expect(screen.getByText('Turno 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('33 %')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Turno de CPU: 1 de 3/ })).toBeInTheDocument();
  });

  it('muestra el estado vacío de la cola de listos cuando no hay procesos esperando', () => {
    render(<PanelPlanificador />);

    expect(screen.getByText('Cola de listos')).toBeInTheDocument();
    expect(screen.getByText('0 en espera')).toBeInTheDocument();
    expect(screen.getByText('No hay procesos esperando.')).toBeInTheDocument();
  });

  it('muestra la cola de listos ordenada por prioridad efectiva y tiempo de espera', () => {
    const pBaja = crearPcbMock({
      pid: 2,
      nombre: 'timelapse',
      estado: 'Listo',
      prioridad: 3,
      ticksEsperando: 2,
    });
    const pAlta = crearPcbMock({
      pid: 3,
      nombre: 'tagfs',
      estado: 'Listo',
      prioridad: 8,
      ticksEsperando: 5,
    });

    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, pBaja, pAlta] });

    render(<PanelPlanificador />);

    expect(screen.getByText('2 en espera')).toBeInTheDocument();
    expect(screen.getByText(/TagFS · Prioridad 8 · Esperando 5 s/)).toBeInTheDocument();
    expect(screen.getByText(/TimeLapse · Prioridad 3 · Esperando 2 s/)).toBeInTheDocument();

    // Verificamos las barras de espera fina
    expect(screen.getByRole('progressbar', { name: /Espera de TagFS: 5 segundos/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Espera de TimeLapse: 2 segundos/ })).toBeInTheDocument();
  });

  it('permite cambiar la velocidad de simulación e interactuar con el selector segmentado', () => {
    render(<PanelPlanificador />);

    const radioX5 = screen.getByRole('radio', { name: '×5' });
    act(() => {
      fireEvent.click(radioX5);
    });

    expect(usePlanificador.getState().velocidad).toBe(5);
    expect(screen.getByText('Velocidad de simulación cambiada a 5')).toBeInTheDocument();
  });

  it('añade y quita procesos de prueba deshabilitando los botones adecuadamente', () => {
    render(<PanelPlanificador />);

    const btnAgregar = screen.getByRole('button', { name: 'Añadir procesos de prueba' });
    const btnQuitar = screen.getByRole('button', { name: 'Quitar procesos de prueba' });

    // Inicialmente no hay demos: quitar está deshabilitado
    expect(btnQuitar).toBeDisabled();
    expect(btnAgregar).not.toBeDisabled();

    // Añadir procesos de prueba
    act(() => {
      fireEvent.click(btnAgregar);
    });

    // Ahora hay demos añadidos
    const listaConDemos = useProcesos.getState().procesos;
    const demos = listaConDemos.filter((p) => p.esDemo);
    expect(demos).toHaveLength(3);

    // Como ya están todos los demos, el botón de añadir se deshabilita
    expect(btnAgregar).toBeDisabled();
    expect(btnQuitar).not.toBeDisabled();

    // Quitar procesos de prueba
    act(() => {
      fireEvent.click(btnQuitar);
    });

    const listaSinDemos = useProcesos.getState().procesos;
    expect(listaSinDemos.filter((p) => p.esDemo)).toHaveLength(0);
    expect(btnQuitar).toBeDisabled();
    expect(btnAgregar).not.toBeDisabled();
  });

  it('muestra la frase didáctica inferior', () => {
    render(<PanelPlanificador />);

    expect(
      screen.getByText('Los procesos esperan su turno, pero las apps siguen funcionando: es una simulación.')
    ).toBeInTheDocument();
  });
});
