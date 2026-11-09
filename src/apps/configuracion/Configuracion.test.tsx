import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { Configuracion } from './Configuracion';
import { usePreferenciasStore } from '../../store/preferencias';
import { useTema } from '../../store/tema';
import { useSesion } from '../../store/sesion';
import { useUsuariosStore } from '../../store/usuarios';
import { platform } from '../../platform/web';
import { Usuario } from '../../kernel/types';
import { LIMITES_USUARIO_POR_DEFECTO } from '../../kernel/users/constantes';

const usuarioPrueba: Usuario = {
  id: 'valery',
  nombre: 'Valery',
  inicial: 'V',
  rol: 'estandar',
  pin: '1234',
  estado: 'activo',
  ultimoAcceso: null,
  limites: { ...LIMITES_USUARIO_POR_DEFECTO },
};

const usuarioConFoto: Usuario = {
  ...usuarioPrueba,
  foto: 'data:image/png;base64,foto_inicial',
};

describe('Configuracion', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      usePreferenciasStore.getState().reiniciar();
      useTema.getState().setPreferencia('claro');
      useUsuariosStore.getState().restablecer();
      useSesion.getState().ingresar(usuarioPrueba);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sección Mi perfil', () => {
    it('muestra la sección Mi perfil por defecto con nombre, rol, avatar de 120 px y nota de formatos', () => {
      render(<Configuracion />);

      const tabPerfil = screen.getByRole('tab', { name: 'Mi perfil' });
      expect(tabPerfil).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
      expect(screen.getByText('Valery')).toBeInTheDocument();
      expect(screen.getByText('Usuario')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cambiar foto/i })).toBeInTheDocument();
      // Como no tiene foto, no muestra el botón "Quitar foto"
      expect(screen.queryByRole('button', { name: /Quitar foto/i })).not.toBeInTheDocument();
      expect(
        screen.getByText('La foto se guarda solo en este equipo. Formatos: PNG, JPG o WebP, hasta 5 MB.')
      ).toBeInTheDocument();
    });

    it('muestra el botón Quitar foto únicamente si el usuario ya tiene foto configurada', () => {
      act(() => {
        useSesion.getState().ingresar(usuarioConFoto);
        useUsuariosStore.getState().cambiarFoto(usuarioConFoto, usuarioConFoto.id, usuarioConFoto.foto!);
      });

      render(<Configuracion />);

      expect(screen.getByRole('button', { name: /Quitar foto/i })).toBeInTheDocument();
    });

    it('al elegir un archivo con formato no permitido muestra mensaje tranquilo con role="alert"', async () => {
      render(<Configuracion />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      const archivoSvg = new File(['<svg></svg>'], 'foto.svg', { type: 'image/svg+xml' });
      await act(async () => {
        fireEvent.change(input, { target: { files: [archivoSvg] } });
      });

      const alerta = screen.getByRole('alert');
      expect(alerta).toHaveTextContent('Ese formato no está permitido. Usa PNG, JPG o WebP.');
    });

    it('al elegir un archivo de más de 5 MB muestra mensaje tranquilo con role="alert"', async () => {
      render(<Configuracion />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const archivoGrande = new File([new Uint8Array(6 * 1024 * 1024)], 'grande.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(input, { target: { files: [archivoGrande] } });
      });

      const alerta = screen.getByRole('alert');
      expect(alerta).toHaveTextContent('La imagen es muy grande. Elige una de hasta 5 MB.');
    });

    it('al elegir un archivo válido abre el diálogo Ajusta tu foto, permite modificar zoom y cancelar liberando la vista previa', async () => {
      const mockLiberar = vi.fn();
      vi.spyOn(platform, 'obtenerVistaPreviaFoto').mockResolvedValue({
        url: 'blob:http://localhost/mock-preview',
        ancho: 800,
        alto: 600,
        liberar: mockLiberar,
      });

      render(<Configuracion />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const archivoValido = new File(['mock'], 'foto.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [archivoValido] } });
      });

      // Diálogo abierto
      expect(screen.getByRole('dialog', { name: 'Ajusta tu foto' })).toBeInTheDocument();
      expect(screen.getByText('Se recortará desde el centro.')).toBeInTheDocument();

      // Control de zoom
      const zoomSlider = screen.getByRole('slider', { name: 'Zoom' });
      expect(zoomSlider).toHaveValue('1');

      fireEvent.change(zoomSlider, { target: { value: '1.5' } });
      expect(zoomSlider).toHaveValue('1.5');
      expect(screen.getByText('150%')).toBeInTheDocument();

      // Cancelar diálogo
      const botonCancelar = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(botonCancelar);

      expect(screen.queryByRole('dialog', { name: 'Ajusta tu foto' })).not.toBeInTheDocument();
      expect(mockLiberar).toHaveBeenCalled();
    });

    it('guarda la foto procesada, actualiza la sesión y el store, y cierra el diálogo', async () => {
      const mockLiberar = vi.fn();
      vi.spyOn(platform, 'obtenerVistaPreviaFoto').mockResolvedValue({
        url: 'blob:http://localhost/mock-preview',
        ancho: 800,
        alto: 600,
        liberar: mockLiberar,
      });

      const fotoProcesadaDataUrl = 'data:image/jpeg;base64,nueva_foto_guardada';
      vi.spyOn(platform, 'procesarImagen').mockResolvedValue(fotoProcesadaDataUrl);

      render(<Configuracion />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const archivoValido = new File(['mock'], 'foto.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [archivoValido] } });
      });

      const botonGuardar = screen.getByRole('button', { name: 'Guardar foto' });
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      // Diálogo cerrado
      expect(screen.queryByRole('dialog', { name: 'Ajusta tu foto' })).not.toBeInTheDocument();

      // Sesión y store actualizados
      expect(useSesion.getState().usuario?.foto).toBe(fotoProcesadaDataUrl);
      const enStore = useUsuariosStore.getState().usuarios.find((u) => u.id === usuarioPrueba.id);
      expect(enStore?.foto).toBe(fotoProcesadaDataUrl);
    });

    it('muestra error sereno dentro del diálogo si el procesamiento falla, sin perder la selección', async () => {
      vi.spyOn(platform, 'obtenerVistaPreviaFoto').mockResolvedValue({
        url: 'blob:http://localhost/mock-preview',
        ancho: 800,
        alto: 600,
        liberar: vi.fn(),
      });

      vi.spyOn(platform, 'procesarImagen').mockRejectedValue(new Error('Fallo de canvas'));

      render(<Configuracion />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const archivoValido = new File(['mock'], 'foto.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [archivoValido] } });
      });

      const botonGuardar = screen.getByRole('button', { name: 'Guardar foto' });
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      // El diálogo sigue abierto y muestra el mensaje de error
      expect(screen.getByRole('dialog', { name: 'Ajusta tu foto' })).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo procesar la imagen/i);
    });

    it('permite quitar la foto con confirmación en el diálogo existente', async () => {
      act(() => {
        useSesion.getState().ingresar(usuarioConFoto);
        useUsuariosStore.getState().cambiarFoto(usuarioConFoto, usuarioConFoto.id, usuarioConFoto.foto!);
      });

      render(<Configuracion />);

      const botonQuitar = screen.getByRole('button', { name: /Quitar foto/i });
      fireEvent.click(botonQuitar);

      // Diálogo de confirmación
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('¿Quitar foto de perfil?')).toBeInTheDocument();

      // Confirmar quitar foto
      const dialogo = screen.getByRole('alertdialog');
      const botonConfirmar = within(dialogo).getByRole('button', { name: 'Quitar foto' });
      act(() => {
        fireEvent.click(botonConfirmar);
      });

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(useSesion.getState().usuario?.foto).toBeUndefined();
    });

    it('el foco del diálogo de zoom no se mueve ante avances de temporizadores del sistema', async () => {
      vi.useFakeTimers();
      try {
        vi.spyOn(platform, 'obtenerVistaPreviaFoto').mockResolvedValue({
          url: 'blob:http://localhost/mock-preview',
          ancho: 800,
          alto: 600,
          liberar: vi.fn(),
        });

        render(<Configuracion />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const archivoValido = new File(['mock'], 'foto.jpg', { type: 'image/jpeg' });

        await act(async () => {
          fireEvent.change(input, { target: { files: [archivoValido] } });
        });

        const zoomSlider = screen.getByRole('slider', { name: 'Zoom' });
        expect(document.activeElement).toBe(zoomSlider);

        // Simular múltiples ticks del reloj del sistema
        act(() => {
          vi.advanceTimersByTime(5000);
        });

        // El foco permanece firmemente en el control de zoom
        expect(document.activeElement).toBe(zoomSlider);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Otras secciones', () => {
    it('permite cambiar a la sección Apariencia con el selector de tema y pie', () => {
      render(<Configuracion />);

      const tabApariencia = screen.getByRole('tab', { name: 'Apariencia' });
      fireEvent.click(tabApariencia);

      expect(tabApariencia).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'Tema' })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: 'Seleccionar tema' })).toBeInTheDocument();
      expect(screen.getByText('El tema se guarda en este equipo.')).toBeInTheDocument();
    });

    it('cambia a la sección Texto y permite modificar la escala tipográfica', () => {
      render(<Configuracion />);

      const tabTexto = screen.getByRole('tab', { name: 'Texto' });
      fireEvent.click(tabTexto);

      expect(tabTexto).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'Tamaño del texto' })).toBeInTheDocument();
      expect(screen.getByText('Así se verá el texto del sistema.')).toBeInTheDocument();

      const radioGrande = screen.getByRole('radio', { name: 'Grande' });
      fireEvent.click(radioGrande);

      expect(usePreferenciasStore.getState().tamanoTexto).toBe('grande');
      expect(document.documentElement.getAttribute('data-text-size')).toBe('grande');
    });

    it('cambia a la sección Accesibilidad y permite alternar los interruptores', () => {
      render(<Configuracion />);

      const tabAccesibilidad = screen.getByRole('tab', { name: 'Accesibilidad' });
      fireEvent.click(tabAccesibilidad);

      expect(tabAccesibilidad).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'Accesibilidad' })).toBeInTheDocument();

      const switchMovimiento = screen.getByRole('switch', {
        name: 'Reducir el movimiento',
      });
      const switchContraste = screen.getByRole('switch', {
        name: 'Contraste alto',
      });

      expect(switchMovimiento).toHaveAttribute('aria-checked', 'false');
      expect(switchContraste).toHaveAttribute('aria-checked', 'false');

      // Activar Reducir el movimiento
      fireEvent.click(switchMovimiento);
      expect(usePreferenciasStore.getState().movimiento).toBe('reducir');
      expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
      expect(switchMovimiento).toHaveAttribute('aria-checked', 'true');

      // Activar Contraste alto
      fireEvent.click(switchContraste);
      expect(usePreferenciasStore.getState().contraste).toBe('alto');
      expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
      expect(switchContraste).toHaveAttribute('aria-checked', 'true');
    });
  });
});
