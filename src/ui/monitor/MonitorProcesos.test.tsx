import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonitorProcesos } from './MonitorProcesos';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { PCB } from '../../kernel/types';

describe('MonitorProcesos', () => {
  beforeEach(() => {
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
  });

  it('muestra el Kernel de Atria-OS como protegido y el aviso de solo sistema activo', () => {
    render(<MonitorProcesos />);

    expect(screen.getByText('Kernel de Atria-OS')).toBeInTheDocument();
    expect(screen.getByText('Protegido')).toBeInTheDocument();
    expect(
      screen.getByText('Solo está activo el sistema. Abre una app para ver su proceso.')
    ).toBeInTheDocument();
  });

  it('muestra procesos de aplicaciones abiertas y permite terminarlos tras confirmación', () => {
    const procesoApp: PCB = {
      pid: 2,
      nombre: 'timelapse',
      estado: 'En ejecución',
      prioridad: 7,
      memoriaMb: 192,
      usuarioId: 'mateo',
      creadoEn: 1000,
      tipoApp: 'web',
    };

    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, procesoApp] });
    useVentanas.setState({
      ventanas: [
        {
          id: 'ventana-2',
          appId: 'timelapse',
          pid: 2,
          x: 0,
          y: 0,
          ancho: 760,
          alto: 520,
          estado: 'normal',
          ordenFoco: 1,
        },
      ],
      focusPid: 'ventana-2',
      _contadorFoco: 1,
    });

    render(<MonitorProcesos />);

    expect(screen.getByText('TimeLapse')).toBeInTheDocument();
    const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
    expect(btnTerminar).toBeInTheDocument();

    // 1. Abrir diálogo de confirmación
    fireEvent.click(btnTerminar);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // 2. Cancelar no termina el proceso
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useProcesos.getState().procesos.find((p) => p.pid === 2)?.estado).toBe('En ejecución');

    // 3. Confirmar termina el proceso y cierra la ventana
    fireEvent.click(btnTerminar);
    const btnConfirmar = screen.getAllByRole('button', { name: 'Terminar' })[1];
    fireEvent.click(btnConfirmar);

    expect(useProcesos.getState().procesos.find((p) => p.pid === 2)?.estado).toBe('Terminado');
    expect(useVentanas.getState().ventanas).toHaveLength(0);
  });
});
