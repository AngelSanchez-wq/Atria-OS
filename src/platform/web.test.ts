import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebPlatform } from './web';

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
});
