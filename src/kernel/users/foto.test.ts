import { describe, it, expect } from 'vitest';
import {
  validarArchivoFoto,
  fotoValida,
  calcularRecorte,
  TAMANO_MAX_ENTRADA_BYTES,
  LONGITUD_MAX_FOTO,
} from './foto';

describe('validarArchivoFoto', () => {
  it('acepta formatos permitidos con tamaño válido (≤ 5 MB)', () => {
    expect(
      validarArchivoFoto({ tipo: 'image/png', tamano: 1024 * 500 })
    ).toEqual({ ok: true });
    expect(
      validarArchivoFoto({ tipo: 'image/jpeg', tamano: 1024 * 1024 })
    ).toEqual({ ok: true });
    expect(
      validarArchivoFoto({ tipo: 'image/webp', tamano: TAMANO_MAX_ENTRADA_BYTES })
    ).toEqual({ ok: true });
  });

  it('rechaza formatos no permitidos (SVG, GIF, PDF)', () => {
    expect(
      validarArchivoFoto({ tipo: 'image/svg+xml', tamano: 1024 })
    ).toEqual({ ok: false, motivo: 'formato-no-permitido' });
    expect(
      validarArchivoFoto({ tipo: 'image/gif', tamano: 1024 })
    ).toEqual({ ok: false, motivo: 'formato-no-permitido' });
    expect(
      validarArchivoFoto({ tipo: 'application/pdf', tamano: 1024 })
    ).toEqual({ ok: false, motivo: 'formato-no-permitido' });
  });

  it('rechaza archivos que exceden los 5 MB', () => {
    expect(
      validarArchivoFoto({
        tipo: 'image/png',
        tamano: TAMANO_MAX_ENTRADA_BYTES + 1,
      })
    ).toEqual({ ok: false, motivo: 'archivo-muy-grande' });
  });
});

describe('fotoValida', () => {
  it('valida data URLs en PNG, JPEG y WebP dentro de la longitud máxima', () => {
    expect(fotoValida('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==')).toBe(true);
    expect(fotoValida('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/')).toBe(true);
    expect(fotoValida('data:image/webp;base64,UklGRkAAAABXRUJQVlA4=')).toBe(true);
  });

  it('rechaza SVG y cualquier otro formato no permitido', () => {
    expect(fotoValida('data:image/svg+xml;base64,PHN2ZyB4bWxucz0=')).toBe(false);
    expect(fotoValida('data:image/gif;base64,R0lGODlhAQABAAAAACw=')).toBe(false);
    expect(fotoValida('https://ejemplo.com/foto.png')).toBe(false);
    expect(fotoValida('texto-plano')).toBe(false);
  });

  it('rechaza cadenas que exceden la longitud máxima de 150.000 caracteres', () => {
    const prefijo = 'data:image/jpeg;base64,';
    const exceso = 'A'.repeat(LONGITUD_MAX_FOTO - prefijo.length + 1);
    expect(fotoValida(prefijo + exceso)).toBe(false);
  });

  it('rechaza entradas nulas, vacías o sin contenido base64', () => {
    expect(fotoValida(null)).toBe(false);
    expect(fotoValida(undefined)).toBe(false);
    expect(fotoValida('')).toBe(false);
    expect(fotoValida('data:image/png;base64,')).toBe(false);
  });
});

describe('calcularRecorte', () => {
  it('calcula recorte centrado en imagen cuadrada', () => {
    // Zoom 1
    const r1 = calcularRecorte(500, 500, 1);
    expect(r1).toEqual({ x: 0, y: 0, lado: 500 });

    // Zoom 2 (lado = 250, centrado en (125, 125))
    const r2 = calcularRecorte(500, 500, 2);
    expect(r2).toEqual({ x: 125, y: 125, lado: 250 });

    // Zoom 3
    const r3 = calcularRecorte(500, 500, 3);
    expect(r3.lado).toBe(167);
    expect(r3.x).toBe(167);
    expect(r3.y).toBe(167);
  });

  it('calcula recorte centrado en imagen horizontal (paisaje)', () => {
    // Ancho 800, Alto 400. Lado base = 400
    // Zoom 1 -> x = (800 - 400)/2 = 200, y = 0
    const r1 = calcularRecorte(800, 400, 1);
    expect(r1).toEqual({ x: 200, y: 0, lado: 400 });

    // Zoom 2 -> lado = 200, x = (800 - 200)/2 = 300, y = (400 - 200)/2 = 100
    const r2 = calcularRecorte(800, 400, 2);
    expect(r2).toEqual({ x: 300, y: 100, lado: 200 });
  });

  it('calcula recorte centrado en imagen vertical (retrato)', () => {
    // Ancho 400, Alto 800. Lado base = 400
    // Zoom 1 -> x = 0, y = (800 - 400)/2 = 200
    const r1 = calcularRecorte(400, 800, 1);
    expect(r1).toEqual({ x: 0, y: 200, lado: 400 });

    // Zoom 2 -> lado = 200, x = 100, y = 300
    const r2 = calcularRecorte(400, 800, 2);
    expect(r2).toEqual({ x: 100, y: 300, lado: 200 });
  });

  it('acota el zoom a los límites [1, 3] ante valores extremos', () => {
    // Zoom < 1 se acota a 1
    const rMenor = calcularRecorte(600, 400, 0.5);
    expect(rMenor).toEqual(calcularRecorte(600, 400, 1));

    // Zoom > 3 se acota a 3
    const rMayor = calcularRecorte(600, 400, 10);
    expect(rMayor).toEqual(calcularRecorte(600, 400, 3));
  });

  it('garantiza que el área del recorte nunca sobrepasa las dimensiones de la imagen', () => {
    const r = calcularRecorte(1920, 1080, 2.5);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.lado).toBeLessThanOrEqual(1920);
    expect(r.y + r.lado).toBeLessThanOrEqual(1080);
  });
});
