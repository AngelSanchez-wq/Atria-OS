type IndicadorPinProps = {
  digitosIngresados: number;
  totalDigitos: number;
};

export function IndicadorPin({ digitosIngresados, totalDigitos }: IndicadorPinProps) {
  const rellenos = Math.min(Math.max(digitosIngresados, 0), totalDigitos);

  return (
    <div
      className="flex items-center gap-3"
      role="status"
      aria-label={`${rellenos} de ${totalDigitos} dígitos`}
    >
      {Array.from({ length: totalDigitos }, (_, indice) => (
        <span
          key={indice}
          aria-hidden="true"
          className={[
            'h-3 w-3 rounded-full transition-colors motion-reduce:transition-none',
            indice < rellenos ? 'bg-ink' : 'bg-line',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
