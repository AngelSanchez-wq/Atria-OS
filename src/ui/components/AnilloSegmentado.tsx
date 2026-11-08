import React from 'react';
import { SegmentoRevision } from '../../kernel/types';
import {
  ANILLO_GROSOR_RATIO,
  LIMITE_SEGMENTOS_CONTINUO,
  TRANSICION_SEGMENTO_MS,
  CLASE_ANILLO_RESPONSIVO,
} from '../../config/revision';

export type AnilloSegmentadoProps = {
  segmentos: SegmentoRevision[];
  children?: React.ReactNode;
  ariaLabel?: string;
  total?: number;
  revisadas?: number;
  pospuestas?: number;
  className?: string;
};

// Coordenadas fijas del viewBox virtual (200x200)
const CX = 100;
const CY = 100;
const RADIO = 80;
const DIAMETRO = RADIO * 2; // 160
const GROSOR_BASE = Math.round(DIAMETRO * ANILLO_GROSOR_RATIO); // ~13
const GROSOR_ACTUAL = GROSOR_BASE + 4; // ~17 (trazo más grueso)
const CIRCUNFERENCIA = 2 * Math.PI * RADIO; // ~502.65

function polarACartesiano(centerX: number, centerY: number, radius: number, anguloGrados: number) {
  const anguloRadianes = (anguloGrados * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(anguloRadianes),
    y: centerY + radius * Math.sin(anguloRadianes),
  };
}

function describirArco(
  x: number,
  y: number,
  radius: number,
  anguloInicio: number,
  anguloFin: number
): string {
  const inicio = polarACartesiano(x, y, radius, anguloInicio);
  const fin = polarACartesiano(x, y, radius, anguloFin);
  const anguloTotal = anguloFin - anguloInicio;
  const flagArcoGrande = anguloTotal > 180 ? '1' : '0';

  return `M ${inicio.x} ${inicio.y} A ${radius} ${radius} 0 ${flagArcoGrande} 1 ${fin.x} ${fin.y}`;
}

export function AnilloSegmentado({
  segmentos,
  children,
  ariaLabel,
  total: totalProp,
  revisadas: revisadasProp,
  pospuestas: pospuestasProp,
  className = '',
}: AnilloSegmentadoProps) {
  const total = totalProp ?? segmentos.length;
  const revisadas =
    revisadasProp ?? segmentos.filter((s) => s.estado === 'revisada').length;
  const pospuestas =
    pospuestasProp ?? segmentos.filter((s) => s.estado === 'pospuesta').length;

  const etiquetaAria =
    ariaLabel ?? `${revisadas} de ${total} revisadas, ${pospuestas} para más tarde`;

  const esModoContinuo = segmentos.length > LIMITE_SEGMENTOS_CONTINUO;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={revisadas}
      aria-label={etiquetaAria}
      className={`relative flex items-center justify-center shrink-0 select-none ${CLASE_ANILLO_RESPONSIVO} ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {esModoContinuo ? (
          // Modo continuo (> 12 segmentos)
          <>
            {/* Pista base */}
            <circle
              cx={CX}
              cy={CY}
              r={RADIO}
              fill="none"
              strokeWidth={GROSOR_BASE}
              className="stroke-line"
            />
            {/* Arco de avance continuo */}
            {total > 0 && revisadas > 0 && (
              <circle
                cx={CX}
                cy={CY}
                r={RADIO}
                fill="none"
                strokeWidth={GROSOR_BASE}
                strokeDasharray={`${(revisadas / total) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                strokeDashoffset={0}
                transform={`rotate(-90 ${CX} ${CY})`}
                strokeLinecap="round"
                className="stroke-accent transition-all duration-[250ms] motion-reduce:transition-none"
                style={{ transitionDuration: `${TRANSICION_SEGMENTO_MS}ms` }}
              />
            )}
          </>
        ) : (
          // Modo segmentado (<= 12 segmentos)
          segmentos.map((segmento, i) => {
            const cantidad = segmentos.length;
            const paso = 360 / cantidad;
            const separacion = cantidad > 1 ? 5 : 0; // Brecha angular entre segmentos

            // Comienza en las 12 en punto (-90 grados)
            const inicio = -90 + i * paso + separacion / 2;
            const fin = -90 + (i + 1) * paso - separacion / 2;
            const d = describirArco(CX, CY, RADIO, inicio, fin);

            let strokeClase: string;
            let strokeWidth = GROSOR_BASE;
            let strokeDasharray: string | undefined = undefined;

            switch (segmento.estado) {
              case 'revisada':
                strokeClase = 'stroke-accent';
                break;
              case 'actual':
                strokeClase = 'stroke-accent-strong';
                strokeWidth = GROSOR_ACTUAL;
                break;
              case 'pendiente-urgente':
                strokeClase = 'stroke-warm-line';
                break;
              case 'pospuesta':
                strokeClase = 'stroke-accent';
                strokeDasharray = '5 4'; // Punteado para pospuestas
                break;
              case 'pendiente':
              default:
                strokeClase = 'stroke-line';
                break;
            }

            return (
              <path
                key={segmento.id}
                d={d}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className={`${strokeClase} transition-all duration-[250ms] motion-reduce:transition-none`}
                style={{ transitionDuration: `${TRANSICION_SEGMENTO_MS}ms` }}
              />
            );
          })
        )}
      </svg>

      {/* Contenido central del anillo */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}
