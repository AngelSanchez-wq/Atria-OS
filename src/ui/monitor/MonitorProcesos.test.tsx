import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { MonitorProcesos } from './MonitorProcesos';
import { useProcesos } from '../../store/procesos';
import { useVentanas } from '../../store/ventanas';
import { useSesion } from '../../store/sesion';
import { useRegistroStore } from '../../store/registro';
import { useUsuariosStore } from '../../store/usuarios';
import { PROCESO_KERNEL_BASE } from '../../kernel/processes/constantes';
import { PCB } from '../../kernel/types';
import { servicioAudio } from '../../system/audio/servicio';
import { crearEvento } from '../../kernel/logs/eventos';
import { USUARIOS_SEMILLA } from '../../kernel/users/usuarios-semilla';

describe('MonitorProcesos (Ventana Administración)', () => {
  const usuarioAdmin = USUARIOS_SEMILLA.find((u) => u.rol === 'admin') ?? USUARIOS_SEMILLA[2];
  const usuarioEstandar = USUARIOS_SEMILLA.find((u) => u.rol === 'estandar') ?? USUARIOS_SEMILLA[0];

  beforeEach(() => {
    localStorage.clear();
    useUsuariosStore.getState().restablecer();
    useSesion.setState({
      usuario: usuarioAdmin,
    });
    useProcesos.setState({ procesos: [PROCESO_KERNEL_BASE] });
    useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
    useRegistroStore.getState().limpiar();
  });

  describe('Control de acceso', () => {
    it('un usuario estándar no accede a la ventana de administración', () => {
      useSesion.setState({
        usuario: usuarioEstandar,
      });

      render(<MonitorProcesos />);

      expect(screen.getByRole('region', { name: 'Acceso restringido' })).toBeInTheDocument();
      expect(
        screen.getByText('Esta aplicación solo está disponible para administradores.')
      ).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('un administrador accede a la ventana con título y 4 pestañas', () => {
      render(<MonitorProcesos />);

      expect(screen.getByRole('region', { name: 'Administración' })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Usuarios/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Procesos' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Planificador' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Registros' })).toBeInTheDocument();
    });
  });

  describe('Pestañas accesibles y navegación por teclado', () => {
    it('inicia en la pestaña Usuarios y permite navegar circularmente con flechas', () => {
      render(<MonitorProcesos />);

      const tabUsuarios = screen.getByRole('tab', { name: /Usuarios/i });
      const tabProcesos = screen.getByRole('tab', { name: 'Procesos' });
      const tabPlanificador = screen.getByRole('tab', { name: 'Planificador' });
      const tabRegistros = screen.getByRole('tab', { name: 'Registros' });

      // Inicia en Usuarios
      expect(tabUsuarios).toHaveAttribute('aria-selected', 'true');
      expect(tabProcesos).toHaveAttribute('aria-selected', 'false');

      // Flecha derecha: va a Procesos
      fireEvent.keyDown(tabUsuarios, { key: 'ArrowRight' });
      expect(tabProcesos).toHaveAttribute('aria-selected', 'true');

      // Flecha derecha: va a Planificador
      fireEvent.keyDown(tabProcesos, { key: 'ArrowRight' });
      expect(tabPlanificador).toHaveAttribute('aria-selected', 'true');

      // Flecha derecha: va a Registros
      fireEvent.keyDown(tabPlanificador, { key: 'ArrowRight' });
      expect(tabRegistros).toHaveAttribute('aria-selected', 'true');

      // Flecha derecha desde Registros: vuelve circular a Usuarios
      fireEvent.keyDown(tabRegistros, { key: 'ArrowRight' });
      expect(tabUsuarios).toHaveAttribute('aria-selected', 'true');

      // Flecha izquierda desde Usuarios: va a Registros
      fireEvent.keyDown(tabUsuarios, { key: 'ArrowLeft' });
      expect(tabRegistros).toHaveAttribute('aria-selected', 'true');

      // Flecha izquierda desde Registros: va a Planificador
      fireEvent.keyDown(tabRegistros, { key: 'ArrowLeft' });
      expect(tabPlanificador).toHaveAttribute('aria-selected', 'true');
    });

    it('permite cambiar a la pestaña Planificador al hacer clic y muestra su panel', () => {
      render(<MonitorProcesos />);

      const tabPlanificador = screen.getByRole('tab', { name: 'Planificador' });
      fireEvent.click(tabPlanificador);

      expect(tabPlanificador).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      expect(
        screen.getByText('Algoritmo: Round Robin con prioridades')
      ).toBeInTheDocument();
    });
  });

  describe('Pestaña Usuarios: tabla, estados y acciones', () => {
    it('muestra encabezados accesibles con scope="col" y la lista de usuarios', () => {
      render(<MonitorProcesos />);

      // Encabezados con scope
      const thUsuario = screen.getByRole('columnheader', { name: 'USUARIO' });
      const thRol = screen.getByRole('columnheader', { name: 'ROL' });
      const thEstado = screen.getByRole('columnheader', { name: 'ESTADO' });
      const thUltimoAcceso = screen.getByRole('columnheader', { name: 'ÚLTIMO ACCESO' });
      const thAcciones = screen.getByRole('columnheader', { name: 'ACCIONES' });

      expect(thUsuario).toHaveAttribute('scope', 'col');
      expect(thRol).toHaveAttribute('scope', 'col');
      expect(thEstado).toHaveAttribute('scope', 'col');
      expect(thUltimoAcceso).toHaveAttribute('scope', 'col');
      expect(thAcciones).toHaveAttribute('scope', 'col');

      // Muestra usuarios
      expect(screen.getByText('Valery')).toBeInTheDocument();
      expect(screen.getByText('Mateo')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('el único administrador activo no muestra botón Bloquear y lleva el texto tenue "Único administrador"', () => {
      render(<MonitorProcesos />);

      expect(screen.getByText('Único administrador')).toBeInTheDocument();

      // No debe haber un botón Bloquear para Admin
      const botonesBloquear = screen.getAllByRole('button', { name: 'Bloquear' });
      // Solo debe existir para los usuarios estándar activos (ej. Valery)
      expect(botonesBloquear).toHaveLength(1);
    });

    it('permite bloquear a un usuario activo y desbloquear a un usuario bloqueado', () => {
      render(<MonitorProcesos />);

      // Valery está activa; la bloqueamos
      const btnBloquearValery = screen.getByRole('button', { name: 'Bloquear' });
      act(() => {
        fireEvent.click(btnBloquearValery);
      });

      const usuarioValery = useUsuariosStore.getState().usuarios.find((u) => u.nombre === 'Valery');
      expect(usuarioValery?.estado).toBe('bloqueado');

      // Mateo está bloqueado en semillas; lo desbloqueamos
      const filaMateo = screen.getByText('Mateo').closest('tr')!;
      const btnDesbloquearMateo = within(filaMateo).getByRole('button', { name: 'Desbloquear' });
      act(() => {
        fireEvent.click(btnDesbloquearMateo);
      });

      const usuarioMateo = useUsuariosStore.getState().usuarios.find((u) => u.nombre === 'Mateo');
      expect(usuarioMateo?.estado).toBe('activo');
    });
  });

  describe('Diálogo Nuevo Usuario', () => {
    it('abre el diálogo con foco en Nombre, valida campos, gestiona el foco de error y crea usuario nuevo', async () => {
      render(<MonitorProcesos />);

      const btnNuevo = screen.getByRole('button', { name: /Nuevo usuario/i });
      fireEvent.click(btnNuevo);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const inputNombre = screen.getByLabelText('Nombre');
      expect(inputNombre).toBeInTheDocument();

      // Esperar el foco inicial en Nombre
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(inputNombre);
      });

      // Intentar enviar vacío -> error y foco en Nombre
      const btnCrear = screen.getByRole('button', { name: 'Crear usuario' });
      fireEvent.click(btnCrear);
      expect(screen.getByRole('alert')).toHaveTextContent('Escribe un nombre para el usuario.');
      expect(document.activeElement).toBe(inputNombre);

      // Escribir nombre
      fireEvent.change(inputNombre, { target: { value: 'Lucía' } });

      // Intentar enviar sin PIN completo -> error y foco en PIN
      fireEvent.click(btnCrear);
      expect(screen.getByRole('alert')).toHaveTextContent('El PIN debe tener exactamente 4 números.');
      const inputPin = screen.getByLabelText('PIN de 4 dígitos');
      expect(document.activeElement).toBe(inputPin);

      // Escribir PIN de 4 dígitos
      fireEvent.change(inputPin, { target: { value: '1234' } });

      // Enviar
      act(() => {
        fireEvent.click(btnCrear);
      });

      // El diálogo se cierra
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Usuario creado en la lista
      expect(screen.getByText('Lucía')).toBeInTheDocument();
    });

    it('tiene un contenedor con altura máxima, cuerpo desplazable y pie fijo', () => {
      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));
      const dialogo = screen.getByRole('dialog');
      expect(dialogo.className).toContain('max-h-[85vh]');

      const cuerpoDesplazable = screen.getByTestId('cuerpo-dialogo-desplazable');
      expect(cuerpoDesplazable.className).toContain('overflow-y-auto');

      const pieFijo = screen.getByTestId('pie-dialogo-fijo');
      expect(pieFijo.className).toContain('shrink-0');
      expect(within(pieFijo).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(within(pieFijo).getByRole('button', { name: 'Crear usuario' })).toBeInTheDocument();
    });

    it('el campo PIN es un input real de tipo password que solo acepta dígitos y actualiza el indicador', () => {
      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));
      const inputPin = screen.getByLabelText('PIN de 4 dígitos') as HTMLInputElement;

      expect(inputPin.tagName).toBe('INPUT');
      expect(inputPin.type).toBe('password');
      expect(inputPin.inputMode).toBe('numeric');
      expect(inputPin.maxLength).toBe(4);
      expect(inputPin.autocomplete).toBe('off');

      // Intentar ingresar letras -> no las acepta
      fireEvent.change(inputPin, { target: { value: 'abcd' } });
      expect(inputPin.value).toBe('');

      // Ingresar números
      fireEvent.change(inputPin, { target: { value: '9876' } });
      expect(inputPin.value).toBe('9876');

      // Indicador visual refleja los 4 dígitos
      expect(screen.getByRole('status', { name: '4 de 4 dígitos' })).toBeInTheDocument();
    });

    it('recorre los campos en el orden natural con Tab y cicla dentro del diálogo', async () => {
      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));

      const dialogo = screen.getByRole('dialog');
      const inputNombre = screen.getByLabelText('Nombre');
      const btnCrear = screen.getByRole('button', { name: 'Crear usuario' });

      // Esperar foco inicial en Nombre
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(inputNombre);
      });

      // Ciclo con trampa de foco: desde Crear hacia adelante con Tab va a Nombre
      btnCrear.focus();
      expect(document.activeElement).toBe(btnCrear);
      fireEvent.keyDown(dialogo, { key: 'Tab' });
      expect(document.activeElement).toBe(inputNombre);

      // Shift+Tab desde Nombre va al último elemento (Crear usuario)
      inputNombre.focus();
      expect(document.activeElement).toBe(inputNombre);
      fireEvent.keyDown(dialogo, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(btnCrear);
    });

    it('permite cancelar con Escape', () => {
      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('mantiene el foco en el campo PIN tras escribir y avanzar 3000 ms sin robar foco a Nombre', () => {
      vi.useFakeTimers();

      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));
      const inputNombre = screen.getByLabelText('Nombre') as HTMLInputElement;
      const inputPin = screen.getByLabelText('PIN de 4 dígitos') as HTMLInputElement;

      // Se enfoca el campo PIN y se escribe un dígito
      inputPin.focus();
      expect(document.activeElement).toBe(inputPin);

      fireEvent.change(inputPin, { target: { value: '7' } });
      expect(inputPin.value).toBe('7');

      // Simular el avance del tiempo (3000 ms) con act()
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // El foco debe seguir en el PIN
      expect(document.activeElement).toBe(inputPin);
      // El campo Nombre no debe haber recibido texto
      expect(inputNombre.value).toBe('');

      vi.useRealTimers();
    });

    it('mantiene el foco en el selector de Rol tras seleccionarlo y avanzar 3000 ms sin robar foco', () => {
      vi.useFakeTimers();

      render(<MonitorProcesos />);

      fireEvent.click(screen.getByRole('button', { name: /Nuevo usuario/i }));
      const inputNombre = screen.getByLabelText('Nombre') as HTMLInputElement;
      const radioAdmin = screen.getByRole('radio', { name: 'Administrador' });

      // Se selecciona y enfoca el rol Administrador
      fireEvent.click(radioAdmin);
      radioAdmin.focus();
      expect(document.activeElement).toBe(radioAdmin);

      // Simular el avance del tiempo (3000 ms) con act()
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // El foco debe seguir en la opción seleccionada de Rol
      expect(document.activeElement).toBe(radioAdmin);
      // El campo Nombre no fue alterado
      expect(inputNombre.value).toBe('');

      vi.useRealTimers();
    });
  });

  describe('Panel Editar Límites', () => {
    it('abre el panel lateral de límites, permite modificar apps, tareas y memoria, y guardar', () => {
      render(<MonitorProcesos />);

      // Editar a Valery
      const botonesEditar = screen.getAllByRole('button', { name: 'Editar' });
      fireEvent.click(botonesEditar[0]);

      const panel = screen.getByRole('complementary', { name: /Límites de Valery/i });
      expect(panel).toBeInTheDocument();

      // Desactivar app Ambient
      const swAmbient = screen.getByRole('switch', { name: 'Habilitar Ambient' });
      fireEvent.click(swAmbient);

      // Aumentar tareas activas a 4
      const btnAumentar = screen.getByRole('button', { name: 'Aumentar tareas' });
      fireEvent.click(btnAumentar);

      // Guardar cambios
      const btnGuardar = screen.getByRole('button', { name: 'Guardar' });
      act(() => {
        fireEvent.click(btnGuardar);
      });

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

      const usuarioActualizado = useUsuariosStore.getState().usuarios.find((u) => u.nombre === 'Valery');
      expect(usuarioActualizado?.limites.appsHabilitadas).not.toContain('ambient');
      expect(usuarioActualizado?.limites.maxTareasActivas).toBe(4);
    });

    it('permite cancelar el panel descartando modificaciones', () => {
      render(<MonitorProcesos />);

      const botonesEditar = screen.getAllByRole('button', { name: 'Editar' });
      fireEvent.click(botonesEditar[0]);

      // Cambiar stepper
      const btnAumentar = screen.getByRole('button', { name: 'Aumentar tareas' });
      fireEvent.click(btnAumentar);

      // Cancelar
      const btnCancelar = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(btnCancelar);

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

      // Límites intactos
      const usuario = useUsuariosStore.getState().usuarios.find((u) => u.nombre === 'Valery');
      expect(usuario?.limites.maxTareasActivas).toBe(3);
    });
  });

  describe('Pestaña Procesos (funcionalidad base)', () => {
    it('muestra el Kernel de Atria-OS como protegido y permite terminar procesos tras confirmación', () => {
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
      fireEvent.click(screen.getByRole('tab', { name: 'Procesos' }));

      expect(screen.getByText('TimeLapse')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'PRIORIDAD' })).toBeInTheDocument();
      const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
      expect(btnTerminar).toBeInTheDocument();

      // Abrir diálogo de confirmación
      fireEvent.click(btnTerminar);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Cancelar no termina el proceso
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(useProcesos.getState().procesos.find((p) => p.pid === 2)?.estado).toBe('En ejecución');

      // Confirmar termina el proceso y cierra la ventana
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
      fireEvent.click(screen.getByRole('tab', { name: 'Procesos' }));

      const btnTerminar = screen.getByRole('button', { name: 'Terminar' });
      fireEvent.click(btnTerminar);

      const btnConfirmar = screen.getAllByRole('button', { name: 'Terminar' })[1];
      fireEvent.click(btnConfirmar);

      expect(spyDetener).toHaveBeenCalledOnce();
    });
  });

  describe('Pestaña Registros: visualización, filtros y limpieza', () => {
    it('muestra el estado vacío tranquilo cuando no hay eventos', () => {
      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument();
    });

    it('muestra encabezados con scope="col" y píldora pastel para aviso', () => {
      const eventoAviso = crearEvento({
        categoria: 'seguridad',
        gravedad: 'aviso',
        mensaje: 'Cuenta bloqueada por 30 segundos',
        usuarioId: 'mateo',
      });
      useRegistroStore.getState().agregar(eventoAviso);

      render(<MonitorProcesos />);
      fireEvent.click(screen.getByRole('tab', { name: 'Registros' }));

      expect(screen.getByRole('columnheader', { name: 'HORA' })).toHaveAttribute('scope', 'col');
      expect(screen.getByRole('columnheader', { name: 'USUARIO' })).toHaveAttribute('scope', 'col');
      expect(screen.getByRole('columnheader', { name: 'EVENTO' })).toHaveAttribute('scope', 'col');

      const pildoraAviso = screen.getByText('Aviso');
      expect(pildoraAviso).toBeInTheDocument();
      expect(pildoraAviso.className).toContain('bg-warm');
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

      const btnLimpiar = screen.getByRole('button', { name: 'Limpiar registro' });
      fireEvent.click(btnLimpiar);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      const btnConfirmar = screen.getAllByRole('button', { name: 'Limpiar registro' })[1];
      fireEvent.click(btnConfirmar);

      expect(useRegistroStore.getState().eventos).toHaveLength(0);
      expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument();
    });
  });

  describe('Avatares y gestión de foto en Administración', () => {
    it('muestra avatares de 40 px con la foto del usuario en la tabla si existe', () => {
      const fotoUrl = 'data:image/png;base64,foto_valery_40';
      act(() => {
        useUsuariosStore.getState().cambiarFoto(usuarioEstandar, usuarioEstandar.id, fotoUrl);
      });

      const { container } = render(<MonitorProcesos />);

      // Verificar que la tabla contiene la imagen de avatar
      const imgAvatar = container.querySelector('tbody img');
      expect(imgAvatar).not.toBeNull();
      expect(imgAvatar).toHaveAttribute('src', fotoUrl);
      expect(imgAvatar?.closest('span')).toHaveClass('h-10', 'w-10');
    });

    it('en el panel Editar muestra el avatar, el texto informativo y el botón Quitar foto condicional con confirmación', () => {
      const fotoUrl = 'data:image/png;base64,foto_valery_panel';
      act(() => {
        useUsuariosStore.getState().cambiarFoto(usuarioEstandar, usuarioEstandar.id, fotoUrl);
      });

      render(<MonitorProcesos />);

      // Abrir panel Editar del usuario estándar
      const botonesEditar = screen.getAllByRole('button', { name: 'Editar' });
      fireEvent.click(botonesEditar[0]);

      // Muestra el panel de edición
      expect(screen.getByRole('heading', { name: new RegExp(`Editar a ${usuarioEstandar.nombre}`, 'i') })).toBeInTheDocument();

      // Muestra el texto informativo
      expect(screen.getByText('Solo la persona usuaria puede cambiar su foto.')).toBeInTheDocument();

      // El administrador no ve ningún botón para subir o cambiar fotos ajenas
      expect(screen.queryByRole('button', { name: /Cambiar foto/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Subir foto/i })).not.toBeInTheDocument();

      // Botón Quitar foto presente porque el usuario tiene foto
      const btnQuitar = screen.getByRole('button', { name: 'Quitar foto' });
      expect(btnQuitar).toBeInTheDocument();

      // Pulsar Quitar foto abre diálogo de confirmación
      fireEvent.click(btnQuitar);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`¿Quitar foto de ${usuarioEstandar.nombre}\\?`, 'i'))).toBeInTheDocument();

      // Confirmar quitar foto
      const btnConfirmar = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Quitar foto' });
      act(() => {
        fireEvent.click(btnConfirmar);
      });

      // El diálogo se cierra y la foto se elimina
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      const usuarioActualizado = useUsuariosStore.getState().usuarios.find((u) => u.id === usuarioEstandar.id);
      expect(usuarioActualizado?.foto).toBeUndefined();
    });
  });
});
