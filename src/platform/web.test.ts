import { WebPlatform } from './web';
import { ErrorImagenPlatform } from './types';

describe('WebPlatform', () => {
  let p: WebPlatform;

  beforeEach(() => {
    localStorage.clear();
    p = new WebPlatform();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('guarda y recupera valores de estado serializados', () => {
    p.saveState('test_key', { foo: 'bar', num: 42 });
    const recovered = p.loadState('test_key', { foo: '', num: 0 });
    expect(recovered).toEqual({ foo: 'bar', num: 42 });
  });

  it('devuelve el valor por defecto si la clave no existe', () => {
    const val = p.loadState('no_existe', 'defecto');
    expect(val).toBe('defecto');
  });

  it('aplica el tema en el elemento html', () => {
    p.applyTheme('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    p.applyTheme('claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('crea un reproductor de audio funcional con loop y volumen', async () => {
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    const mockPause = vi.fn();
    const mockConstructor = vi.fn();

    class MockAudio {
      src: string;
      play = mockPlay;
      pause = mockPause;
      loop = false;
      volume = 1;
      currentTime = 0;

      constructor(src: string) {
        this.src = src;
        mockConstructor(src);
      }
    }

    vi.stubGlobal('Audio', MockAudio);

    try {
      const player = p.createAudioPlayer();
      player.setVolume(0.8);
      expect(player.getVolume()).toBe(0.8);

      await player.play('sounds/lluvia.mp3');
      expect(mockConstructor).toHaveBeenCalledWith('sounds/lluvia.mp3');
      expect(mockPlay).toHaveBeenCalled();

      player.stop();
      expect(mockPause).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  describe('Batería en WebPlatform', () => {
    it('obtiene el estado real de la batería cuando navigator.getBattery existe', async () => {
      const mockBattery = {
        level: 0.85,
        charging: true,
        dischargingTime: Infinity,
        chargingTime: 1800,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      vi.stubGlobal('navigator', {
        ...navigator,
        getBattery: vi.fn().mockResolvedValue(mockBattery),
      });

      const estado = await p.getBatteryStatus();
      expect(estado.nivel).toBe(85);
      expect(estado.cargando).toBe(true);
      expect(estado.esSimulada).toBe(false);
      expect(estado.tiempoCargaSegundos).toBe(1800);
      expect(estado.tiempoDescargaSegundos).toBeUndefined();
    });

    it('cae a batería simulada cuando navigator.getBattery no existe o falla', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        getBattery: undefined,
      });

      const estado = await p.getBatteryStatus();
      expect(estado.nivel).toBe(72);
      expect(estado.cargando).toBe(false);
      expect(estado.esSimulada).toBe(true);
    });

    it('escucha cambios de batería y permite desuscribirse', async () => {
      const escuchadores = new Map<string, () => void>();
      const mockBattery = {
        level: 0.9,
        charging: false,
        dischargingTime: 7200,
        chargingTime: Infinity,
        addEventListener: vi.fn((tipo: string, fn: () => void) => {
          escuchadores.set(tipo, fn);
        }),
        removeEventListener: vi.fn((tipo: string) => {
          escuchadores.delete(tipo);
        }),
      };

      vi.stubGlobal('navigator', {
        ...navigator,
        getBattery: vi.fn().mockResolvedValue(mockBattery),
      });

      const cb = vi.fn();
      const desuscribir = p.onBatteryChange(cb);

      await vi.waitFor(() => {
        expect(cb).toHaveBeenCalled();
      });

      desuscribir();
      expect(mockBattery.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Red en WebPlatform', () => {
    it('obtiene el estado en línea y la calidad cuando navigator.connection está presente', () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: true,
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });

      const estado = p.getNetworkStatus();
      expect(estado.enLinea).toBe(true);
      expect(estado.calidad).toBe('Buena · aprox. 10 Mbps · 50 ms');
    });

    it('devuelve calidad undefined si navigator.connection no existe', () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: true,
        connection: undefined,
      });

      const estado = p.getNetworkStatus();
      expect(estado.enLinea).toBe(true);
      expect(estado.calidad).toBeUndefined();
    });

    it('detecta estado sin conexión (offline)', () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: false,
      });

      const estado = p.getNetworkStatus();
      expect(estado.enLinea).toBe(false);
    });

    it('reacciona a eventos online, offline y de cambio de conexión', () => {
      let conexionListener: (() => void) | undefined;
      const mockConn = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        addEventListener: vi.fn((tipo: string, fn: () => void) => {
          if (tipo === 'change') conexionListener = fn;
        }),
        removeEventListener: vi.fn(),
      };

      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: true,
        connection: mockConn,
      });

      const cb = vi.fn();
      const desuscribir = p.onNetworkChange(cb);

      // Simular evento offline
      window.dispatchEvent(new Event('offline'));
      expect(cb).toHaveBeenCalled();

      // Simular cambio de conexión
      conexionListener?.();
      expect(cb).toHaveBeenCalledTimes(2);

      desuscribir();
      expect(mockConn.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Procesamiento de imágenes y avatares', () => {
    let revokeSpy: ReturnType<typeof vi.fn>;
    let createObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createObjectURLSpy = vi.fn(() => 'blob:http://localhost/mock-blob-uuid');
      revokeSpy = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL;
      globalThis.URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
    });

    it('rechaza archivos vacíos o nulos al obtener vista previa', async () => {
      const archivoVacio = new File([], 'vacio.jpg', { type: 'image/jpeg' });
      await expect(p.obtenerVistaPreviaFoto(archivoVacio)).rejects.toBeInstanceOf(ErrorImagenPlatform);
      await expect(p.obtenerVistaPreviaFoto(archivoVacio)).rejects.toMatchObject({
        motivo: 'archivo-invalido',
      });
    });

    it('rechaza archivos mayores a 5 MB al obtener vista previa', async () => {
      const archivoGrande = new File([new Uint8Array(6 * 1024 * 1024)], 'grande.jpg', {
        type: 'image/jpeg',
      });
      await expect(p.obtenerVistaPreviaFoto(archivoGrande)).rejects.toMatchObject({
        motivo: 'imagen-demasiado-grande',
      });
    });

    it('obtiene dimensiones y vista previa liberable para un archivo válido', async () => {
      const mockImgInstance = {
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_val: string) {
          setTimeout(() => this.onload?.(), 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(function () {
        return mockImgInstance;
      }));

      const archivo = new File(['mock content'], 'foto.jpg', { type: 'image/jpeg' });
      const vistaPrevia = await p.obtenerVistaPreviaFoto(archivo);

      expect(vistaPrevia.url).toBe('blob:http://localhost/mock-blob-uuid');
      expect(vistaPrevia.ancho).toBe(800);
      expect(vistaPrevia.alto).toBe(600);

      vistaPrevia.liberar();
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob-uuid');
    });

    it('rechaza si la imagen no se puede decodificar', async () => {
      const mockImgInstance = {
        naturalWidth: 0,
        naturalHeight: 0,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_val: string) {
          setTimeout(() => this.onerror?.(), 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(function () {
        return mockImgInstance;
      }));

      const archivo = new File(['corrupto'], 'roto.jpg', { type: 'image/jpeg' });
      await expect(p.obtenerVistaPreviaFoto(archivo)).rejects.toMatchObject({
        motivo: 'decodificacion-fallida',
      });
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob-uuid');
    });

    it('rechaza imágenes con dimensiones gigantescas (> 8192px)', async () => {
      const mockImgInstance = {
        naturalWidth: 10000,
        naturalHeight: 10000,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_val: string) {
          setTimeout(() => this.onload?.(), 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(function () {
        return mockImgInstance;
      }));

      const archivo = new File(['gigante'], 'gigante.jpg', { type: 'image/jpeg' });
      await expect(p.obtenerVistaPreviaFoto(archivo)).rejects.toMatchObject({
        motivo: 'imagen-demasiado-grande',
      });
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob-uuid');
    });

    it('procesa y recorta la imagen redimensionándola a 256x256', async () => {
      const mockImgInstance = {
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_val: string) {
          setTimeout(() => this.onload?.(), 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(function () {
        return mockImgInstance;
      }));

      const drawImageSpy = vi.fn();
      const toDataURLSpy = vi.fn(() => 'data:image/jpeg;base64,resultado_procesado');

      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({
              drawImage: drawImageSpy,
            })),
            toDataURL: toDataURLSpy,
          } as unknown as HTMLCanvasElement;
        }
        return origCreateElement(tag);
      });

      const archivo = new File(['mock content'], 'avatar.jpg', { type: 'image/jpeg' });
      const recorte = { x: 100, y: 0, lado: 600 };

      const resultado = await p.procesarImagen(archivo, recorte);

      expect(resultado).toBe('data:image/jpeg;base64,resultado_procesado');
      expect(drawImageSpy).toHaveBeenCalledWith(
        mockImgInstance,
        100,
        0,
        600,
        600,
        0,
        0,
        256,
        256
      );
      expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.85);
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob-uuid');
    });

    it('procesarImagen valida archivo y recorte', async () => {
      const archivoVacio = new File([], 'vacio.jpg', { type: 'image/jpeg' });
      await expect(p.procesarImagen(archivoVacio, { x: 0, y: 0, lado: 100 })).rejects.toMatchObject({
        motivo: 'archivo-invalido',
      });

      const archivoValido = new File(['abc'], 'valido.jpg', { type: 'image/jpeg' });
      await expect(p.procesarImagen(archivoValido, { x: 0, y: 0, lado: 0 })).rejects.toMatchObject({
        motivo: 'archivo-invalido',
      });
      await expect(p.procesarImagen(archivoValido, { x: -10, y: 0, lado: 100 })).rejects.toMatchObject({
        motivo: 'archivo-invalido',
      });
    });
  });
});
