import { useEffect, useState } from 'react';
import { PantallaEncendido } from './ui/boot/PantallaEncendido';
import { PantallaLogin } from './ui/login/PantallaLogin';
import { PantallaBienvenida } from './ui/welcome/PantallaBienvenida';
import { PantallaEscritorio } from './ui/desktop/PantallaEscritorio';
import { PantallaSuspendido } from './ui/power/PantallaSuspendido';
import { PantallaApagando } from './ui/power/PantallaApagando';
import { PantallaApagado } from './ui/power/PantallaApagado';
import { Dialogo } from './ui/components/Dialogo';
import { useSesion } from './store/sesion';
import { useTareas } from './store/tareas';
import { useVentanas } from './store/ventanas';
import { useProcesos } from './store/procesos';
import { useEnergia } from './store/energia';
import { useNotificaciones } from './store/notificaciones';
import { usePlanificador } from './store/planificador';
import { iniciarSimuladorNotificaciones } from './system/notifications/simulador';
import { iniciarMotorPlanificador } from './system/scheduling/motor';
import { iniciarServicioBateria } from './system/power/servicio';
import { iniciarServicioRed } from './system/network/servicio';
import {
  restaurarProcesosDeSuspension,
  limpiarProcesosPorReinicioOApagado,
} from './kernel/power/transiciones';
import {
  pausarProcesosDeUsuario,
  restaurarProcesosDeUsuario,
  terminarProcesosDeUsuario,
} from './kernel/processes/usuario-aislamiento';
import { TAREAS_SEMILLA } from './kernel/tasks/tareas-semilla';
import { Usuario } from './kernel/types';
import { registrar } from './system/logging/servicio';

export default function App() {
  const usuario = useSesion((s) => s.usuario);
  const estadosProcesosPorUsuario = useSesion(
    (s) => s.estadosProcesosPorUsuario
  );
  const tareasPorUsuario = useSesion((s) => s.tareasPorUsuario);
  const ingresar = useSesion((s) => s.ingresar);
  const salir = useSesion((s) => s.salir);
  const guardarEstadosUsuario = useSesion((s) => s.guardarEstadosUsuario);
  const guardarTareasUsuario = useSesion((s) => s.guardarTareasUsuario);
  const limpiarUsuario = useSesion((s) => s.limpiarUsuario);

  const iniciada = useTareas((s) => s.iniciada);
  const empezarTarea = useTareas((s) => s.empezar);

  const procesos = useProcesos((s) => s.procesos);

  const [dialogoCerrarSesion, setDialogoCerrarSesion] = useState(false);

  const {
    estado,
    estadosProcesosPrevios,
    dialogoConfirmacion,
    transicionar,
    cancelarDialogo,
  } = useEnergia();

  const sesionActiva = estado === 'activo' && !!usuario;

  useEffect(() => {
    if (!sesionActiva) return;

    // Iniciar servicios del sistema durante la sesión activa
    const detenerSimulador = iniciarSimuladorNotificaciones();
    usePlanificador.getState().iniciar();
    const detenerPlanificador = iniciarMotorPlanificador();
    const detenerBateria = iniciarServicioBateria();
    const detenerRed = iniciarServicioRed();

    return () => {
      detenerSimulador();
      detenerPlanificador();
      usePlanificador.getState().detener();
      detenerBateria();
      detenerRed();
    };
  }, [sesionActiva]);

  const manejarIngresar = (u: Usuario) => {
    ingresar(u);
    // Restaurar procesos del usuario
    const estadosPrevios = estadosProcesosPorUsuario[u.id];
    if (estadosPrevios) {
      const restaurados = restaurarProcesosDeUsuario(
        useProcesos.getState().procesos,
        u.id,
        estadosPrevios
      );
      useProcesos.setState({ procesos: restaurados });
    }

    // Restaurar tareas del usuario si ya tenía una activa
    const tareasPrevias = tareasPorUsuario[u.id];
    if (tareasPrevias) {
      useTareas.setState({
        ...tareasPrevias,
        iniciada: tareasPrevias.iniciada ?? true,
      });
    } else {
      useTareas.setState({
        tareaActiva: null,
        pendientes: [],
        estado: 'en-curso',
        segundosTranscurridos: 0,
        ultimaTerminada: null,
        enLogro: false,
        iniciada: false,
      });
    }

    transicionar('activo');
  };

  const manejarCambiarUsuario = () => {
    if (usuario) {
      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: `Cambio de usuario desde ${usuario.nombre}`,
        usuarioId: usuario.id,
      });

      const { procesosActualizados, estadosPrevios } = pausarProcesosDeUsuario(
        useProcesos.getState().procesos,
        usuario.id
      );
      guardarEstadosUsuario(usuario.id, estadosPrevios);
      useProcesos.setState({ procesos: procesosActualizados });

      const stTareas = useTareas.getState();
      guardarTareasUsuario(usuario.id, {
        tareaActiva: stTareas.tareaActiva,
        pendientes: stTareas.pendientes,
        estado: stTareas.estado,
        segundosTranscurridos: stTareas.segundosTranscurridos,
        iniciada: stTareas.iniciada,
      });
      useTareas.setState({
        tareaActiva: null,
        pendientes: [],
        estado: 'en-curso',
        segundosTranscurridos: 0,
        ultimaTerminada: null,
        enLogro: false,
        iniciada: false,
      });
      useNotificaciones.getState().reiniciar();
    }
    salir();
    transicionar('login');
  };

  const solicitarCerrarSesion = () => {
    setDialogoCerrarSesion(true);
  };

  const confirmarCerrarSesion = () => {
    if (usuario) {
      registrar({
        categoria: 'sesion',
        gravedad: 'info',
        mensaje: `Cierre de sesión de ${usuario.nombre}`,
        usuarioId: usuario.id,
      });

      const procesosLimpios = terminarProcesosDeUsuario(
        useProcesos.getState().procesos,
        usuario.id
      );
      useProcesos.setState({ procesos: procesosLimpios });
      useVentanas.getState().cerrarDeUsuario(usuario.id);
      limpiarUsuario(usuario.id);
      useTareas.setState({
        tareaActiva: null,
        pendientes: [],
        estado: 'en-curso',
        segundosTranscurridos: 0,
        ultimaTerminada: null,
        enLogro: false,
        iniciada: false,
      });
      useNotificaciones.getState().reiniciar();
    }
    salir();
    setDialogoCerrarSesion(false);
    transicionar('login');
  };

  // 1. Encendido
  if (estado === 'encendiendo') {
    return <PantallaEncendido onTerminar={() => transicionar('login')} />;
  }

  // 2. Login general
  if (estado === 'login') {
    return <PantallaLogin onIngresar={manejarIngresar} />;
  }

  // 3. Bloqueado (reautenticación con el usuario en sesión)
  if (estado === 'bloqueado') {
    return (
      <PantallaLogin
        usuarios={usuario ? [usuario] : undefined}
        onIngresar={() => {
          transicionar('activo');
        }}
      />
    );
  }

  // 4. Suspendido
  if (estado === 'suspendido') {
    return (
      <PantallaSuspendido
        onReanudar={() => {
          const restaurados = restaurarProcesosDeSuspension(
            procesos,
            estadosProcesosPrevios
          );
          useProcesos.setState({ procesos: restaurados });
          transicionar('activo');
        }}
      />
    );
  }

  // 5. Apagando
  if (estado === 'apagando') {
    return (
      <PantallaApagando
        modo="apagando"
        onTerminar={() => {
          salir();
          useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
          useProcesos.setState({ procesos: limpiarProcesosPorReinicioOApagado() });
          useTareas.setState({
            tareaActiva: null,
            pendientes: [],
            estado: 'en-curso',
            segundosTranscurridos: 0,
            ultimaTerminada: null,
            enLogro: false,
            iniciada: false,
          });
          useNotificaciones.getState().reiniciar();
          transicionar('apagado');
        }}
      />
    );
  }

  // 6. Reiniciando
  if (estado === 'reiniciando') {
    return (
      <PantallaApagando
        modo="reiniciando"
        onTerminar={() => {
          salir();
          useVentanas.setState({ ventanas: [], focusPid: null, _contadorFoco: 0 });
          useProcesos.setState({ procesos: limpiarProcesosPorReinicioOApagado() });
          useTareas.setState({
            tareaActiva: null,
            pendientes: [],
            estado: 'en-curso',
            segundosTranscurridos: 0,
            ultimaTerminada: null,
            enLogro: false,
            iniciada: false,
          });
          useNotificaciones.getState().reiniciar();
          transicionar('encendiendo');
        }}
      />
    );
  }

  // 7. Apagado
  if (estado === 'apagado') {
    return (
      <PantallaApagado
        onEncender={() => {
          transicionar('encendiendo');
        }}
      />
    );
  }

  // 8. Activo (Bienvenida o Escritorio)
  return (
    <>
      {!iniciada ? (
        <PantallaBienvenida
          onEmpezar={(tarea) => {
            const pendientes = TAREAS_SEMILLA.filter((t) => t.id !== tarea.id);
            empezarTarea(tarea, pendientes);
          }}
          onCambiarUsuario={manejarCambiarUsuario}
          onCerrarSesion={solicitarCerrarSesion}
        />
      ) : (
        <PantallaEscritorio
          onCambiarUsuario={manejarCambiarUsuario}
          onCerrarSesion={solicitarCerrarSesion}
        />
      )}

      {/* Diálogos de confirmación para Apagar, Reiniciar y Cerrar Sesión */}
      <Dialogo
        abierto={dialogoConfirmacion === 'apagar'}
        titulo="¿Apagar Atria-OS?"
        mensaje="Se guardarán tus tareas y se cerrarán las apps abiertas."
        textoConfirmar="Apagar"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          registrar({
            categoria: 'energia',
            gravedad: 'info',
            mensaje: 'Apagado del sistema',
            usuarioId: usuario?.id,
          });
          transicionar('apagando');
        }}
        onCancelar={cancelarDialogo}
      />

      <Dialogo
        abierto={dialogoConfirmacion === 'reiniciar'}
        titulo="¿Reiniciar Atria-OS?"
        mensaje="Se guardarán tus tareas y se cerrarán las apps abiertas."
        textoConfirmar="Reiniciar"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          registrar({
            categoria: 'energia',
            gravedad: 'info',
            mensaje: 'Reinicio del sistema',
            usuarioId: usuario?.id,
          });
          transicionar('reiniciando');
        }}
        onCancelar={cancelarDialogo}
      />

      <Dialogo
        abierto={dialogoCerrarSesion}
        titulo={`¿Cerrar sesión de ${usuario?.nombre ?? 'usuario'}?`}
        mensaje="Se cerrarán todas tus aplicaciones y ventanas abiertas."
        textoConfirmar="Cerrar sesión"
        textoCancelar="Cancelar"
        onConfirmar={confirmarCerrarSesion}
        onCancelar={() => setDialogoCerrarSesion(false)}
      />
    </>
  );
}
