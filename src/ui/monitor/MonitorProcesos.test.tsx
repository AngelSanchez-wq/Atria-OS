import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonitorProcesos } from './MonitorProcesos';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { useSesion } from '../../store/sesion';
import { useRegistroStore } from '../../store/registro';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { PCB } from '../../kernel/types';
import { servicioAudio } from '../../system/audio/servicio';
import { crearEvento } from '../../kernel/logs/eventos';

describe('MonitorProcesos', () => {
  beforeEach(() => {
    useSesion.setState({
      usuario: { id: 'admin', nombre: 'Admin', inicial: 'A', rol: 'admin', pin: '0000' },
    });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
    useRegistroStore.getState().limpiar();
  });

  describe('Control de acceso', () => {
    it('un usuario estándar no accede al monitor ni al registro', () => {
      useSesion.setState({
        usuario: { id: 'mia', nombre: 'Mia', inicial: 'M', rol: 'estandar', pin: '1234' },
      });

      render(<MonitorProcesos />);

      expect(screen.getByRole('region', { name: 'Acceso restringido' })).toBeInTheDocument();
      expect(
        screen.getByText('Esta aplicación solo está disponible para administradores.')
      ).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByText('Kernel de Atria-OS')).not.toBeInTheDocument();
    });

    it('un administrador accede al monitor y a sus pestañas', () => {
      render(<MonitorProcesos />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Procesos' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Registros' })).toBeInTheDocument();
    });
  });

  describe('Pestaña Procesos (funcionalidad base)', () => {
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
            usuarioId: 'mateo',
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

    it('terminar el proceso de Ambient detiene el audio del sistema', () => {
      const spyDetener = vi.spyOn(servicioAudio, 'detener');

      const procesoAmbient: PCB = {
        pid: 3,
        nombre: 'ambient',
        estado: 'En ejecución',
        prioridad: 1,
        memoriaMb: 48,
        usuarioId: 'mateo',
        creadoEn: 1000,
        tipoApp: 'interna',
      };

      useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE, procesoAmbient] });
      render(<MonitorProcesos />);

      const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
      fireEvent.click(btnTerminar);

      const btnConfirmar = screen.getAllByRole('button', { name: 'Terminar' })[1];
      fireEvent.click(btnConfirmar);

      expect(spyDetener).toHaveBeenCalledOnce();
    });
  });

  describe('Pestañas accesibles y navegación por teclado', () => {
    it('permite conmutar a la pestaña Registros mediante clic y teclado', () => {
      render(<MonitorProcesos />);

      const tabProcesos = screen.getByRole('tab', { name: 'Procesos' });
      const tabRegistros = screen.getByRole('tab', { name: 'Registros' });

      expect(tabProcesos).toHaveAttribute('aria-selected', 'true');
      expect(tabRegistros).toHaveAttribute('aria-selected', 'false');

      // Navegación con tecla flecha derecha
      fireEvent.keyDown(tabProcesos, { key: 'ArrowRight' });
      expect(tabRegistros).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel', { name: 'Registros' })).toBeInTheDocument();

      // Navegación con tecla flecha izquierda
      fireEvent.keyDown(tabRegistros, { key: 'ArrowLeft' });
      expect(tabProcesos).toHaveAttribute('aria-selected', 'true');

      // Conmutación por clic
      fireEvent.click(tabRegistros);
      expect(tabRegistros).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Pestaña Registros: visualización, filtros y avisos', () => {
    it('muestra el estado vacío tranquilo cuando no hay eventos', () => {
      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument();
    });

    it('muestra encabezados con scope="col" y eventos ordenados del más reciente al más antiguo', () => {
      const e1 = crearEvento({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Inició sesión',
        usuarioId: 'admin',
        instante: 1000,
      });
      const e2 = crearEvento({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'PIN incorrecto (quedan 2 intentos)',
        usuarioId: 'mateo',
        instante: 2000,
      });

      useRegistroStore.getState().agregar(e1);
      useRegistroStore.getState().agregar(e2);

      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      // Encabezados con scope
      const thHora = screen.getByRole('columnheader', { name: 'HORA' });
      const thUsuario = screen.getByRole('columnheader', { name: 'USUARIO' });
      const thEvento = screen.getByRole('columnheader', { name: 'EVENTO' });
      expect(thHora).toHaveAttribute('scope', 'col');
      expect(thUsuario).toHaveAttribute('scope', 'col');
      expect(thEvento).toHaveAttribute('scope', 'col');

      // El evento e2 (más reciente) debe aparecer primero
      const filas = screen.getAllByRole('row');
      // filas[0] es thead, filas[1] es primer evento (e2), filas[2] es segundo evento (e1)
      expect(filas[1]).toHaveTextContent('PIN incorrecto (quedan 2 intentos)');
      expect(filas[1]).toHaveTextContent('Mateo');
      expect(filas[2]).toHaveTextContent('Inició sesión');
      expect(filas[2]).toHaveTextContent('Admin');
    });

    it('muestra la píldora amarillo pastel "Aviso" para eventos de gravedad aviso', () => {
      const eventoAviso = crearEvento({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'Cuenta bloqueada por 30 segundos',
        usuarioId: 'mateo',
      });
      const eventoInfo = crearEvento({
        categoria: 'proceso',
        gravedad: 'info',
        mensaje: 'Terminó el proceso TagFS',
        usuarioId: 'admin',
      });

      useRegistroStore.getState().agregar(eventoAviso);
      useRegistroStore.getState().agregar(eventoInfo);

      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      const pildoraAviso = screen.getByText('Aviso');
      expect(pildoraAviso).toBeInTheDocument();
      expect(pildoraAviso.className).toContain('bg-warm');
      expect(pildoraAviso.className).toContain('text-warm-ink');

      // Solo 1 píldora de aviso para el evento que lo requiere
      expect(screen.getAllByText('Aviso')).toHaveLength(1);
    });

    it('filtra los eventos al pulsar los chips de categoría', () => {
      const eSesion = crearEvento({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Sesión iniciada',
        usuarioId: 'admin',
      });
      const eSeguridad = crearEvento({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'Intento de PIN fallido',
        usuarioId: 'mateo',
      });
      const eProceso = crearEvento({
        categoria: 'proceso',
        gravedad: 'info',
        mensaje: 'Proceso iniciado: FocusPad',
      });

      useRegistroStore.getState().agregar(eSesion);
      useRegistroStore.getState().agregar(eSeguridad);
      useRegistroStore.getState().agregar(eProceso);

      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      // En "Todo", se ven los 3
      expect(screen.getByText('Sesión iniciada')).toBeInTheDocument();
      expect(screen.getByText('Intento de PIN fallido')).toBeInTheDocument();
      expect(screen.getByText('Proceso iniciado: FocusPad')).toBeInTheDocument();

      // Filtrar por Seguridad
      fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }));
      expect(screen.queryByText('Sesión iniciada')).not.toBeInTheDocument();
      expect(screen.getByText('Intento de PIN fallido')).toBeInTheDocument();
      expect(screen.queryByText('Proceso iniciado: FocusPad')).not.toBeInTheDocument();

      // Filtrar por Energía (vacío)
      fireEvent.click(screen.getByRole('button', { name: 'Energía' }));
      expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument();

      // Volver a Todo
      fireEvent.click(screen.getByRole('button', { name: 'Todo' }));
      expect(screen.getByText('Sesión iniciada')).toBeInTheDocument();
      expect(screen.getByText('Intento de PIN fallido')).toBeInTheDocument();
      expect(screen.getByText('Proceso iniciado: FocusPad')).toBeInTheDocument();
    });

    it('permite limpiar el registro mediante diálogo de confirmación', () => {
      const evento = crearEvento({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: 'Evento a borrar',
        usuarioId: 'admin',
      });
      useRegistroStore.getState().agregar(evento);

      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      expect(screen.getByText('Evento a borrar')).toBeInTheDocument();

      const btnLimpiar = screen.getByRole('button', { name: 'Limpiar registro' });
      fireEvent.click(btnLimpiar);

      // Se abre el diálogo
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('¿Limpiar el registro de eventos?')).toBeInTheDocument();

      // Cancelar no borra
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByText('Evento a borrar')).toBeInTheDocument();

      // Confirmar limpia el registro
      fireEvent.click(btnLimpiar);
      const btnConfirmar = screen.getAllByRole('button', { name: 'Limpiar registro' })[1];
      fireEvent.click(btnConfirmar);

      expect(useRegistroStore.getState().eventos).toHaveLength(0);
      expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument();
    });
  });
});
