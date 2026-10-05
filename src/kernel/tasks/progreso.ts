export function calcularPorcentaje(segundosTranscurridos: number, minutosTotales: number): number {
  if (minutosTotales <= 0) return 100;
  const totalSegundos = minutosTotales * 60;
  const porcentaje = (segundosTranscurridos / totalSegundos) * 100;
  return Math.min(100, Math.max(0, porcentaje));
}

export function obtenerColorProgreso(porcentaje: number): 'acento' | 'calido' {
  return porcentaje < 80 ? 'acento' : 'calido';
}
