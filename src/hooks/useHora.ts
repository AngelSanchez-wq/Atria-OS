import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const INTERVALO_MS = 60_000;

function capitalizar(texto: string): string {
  if (!texto) {
    return texto;
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearHora(fecha: Date): string {
  return format(fecha, 'HH:mm');
}

/** Ejemplo: "Mié 30 sep". */
export function formatearFechaCorta(fecha: Date): string {
  return capitalizar(format(fecha, 'EEE d MMM', { locale: es }));
}

/** Reloj del equipo; se actualiza cada minuto. */
export function useHora(ahoraInicial?: Date) {
  const [ahora, setAhora] = useState(() => ahoraInicial ?? new Date());

  useEffect(() => {
    const temporizador = window.setInterval(() => {
      setAhora(new Date());
    }, INTERVALO_MS);

    return () => window.clearInterval(temporizador);
  }, []);

  return {
    ahora,
    hora: formatearHora(ahora),
    fecha: formatearFechaCorta(ahora),
  };
}
