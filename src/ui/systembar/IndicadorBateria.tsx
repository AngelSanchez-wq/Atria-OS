import { forwardRef } from 'react';
import { Battery, BatteryCharging, BatteryLow } from 'lucide-react';
import { TAMANO_ICONO_BARRA } from '../../config/systembar';
import { BotonIcono } from './BotonIcono';
import { EstadoBateria } from '../../kernel/power/bateria';

export type IndicadorBateriaProps = {
  porcentaje: number;
  cargando?: boolean;
  estado?: EstadoBateria;
  abierto?: boolean;
  onClick?: () => void;
};

export const IndicadorBateria = forwardRef<
  HTMLButtonElement,
  IndicadorBateriaProps
>(function IndicadorBateria(
  { porcentaje, cargando = false, estado = 'descargando', abierto = false, onClick },
  ref
) {
  const IconoBateria = cargando
    ? BatteryCharging
    : porcentaje <= 20
    ? BatteryLow
    : Battery;

  const textoEstado = cargando ? 'cargando' : estado;
  const etiqueta = `Batería ${porcentaje} %, ${textoEstado}`;

  return (
    <BotonIcono
      ref={ref}
      etiqueta={etiqueta}
      onClick={onClick}
      className={abierto ? 'text-accent' : 'text-accent'}
    >
      <IconoBateria size={TAMANO_ICONO_BARRA} aria-hidden="true" />
      <span className="text-sm font-semibold">{porcentaje} %</span>
    </BotonIcono>
  );
});
