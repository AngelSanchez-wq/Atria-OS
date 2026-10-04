import { Battery } from 'lucide-react';
import { TAMANO_ICONO_BARRA } from '../../config/systembar';
import { BotonIcono } from './BotonIcono';

type IndicadorBateriaProps = {
  porcentaje: number;
  onClick?: () => void;
};

export function IndicadorBateria({ porcentaje, onClick }: IndicadorBateriaProps) {
  const etiqueta = `Batería ${porcentaje} %`;

  return (
    <BotonIcono etiqueta={etiqueta} onClick={onClick} className="text-accent">
      <Battery size={TAMANO_ICONO_BARRA} aria-hidden="true" />
      <span className="text-sm font-semibold">{porcentaje} %</span>
    </BotonIcono>
  );
}
