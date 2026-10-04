import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';

type IconoAppProps = {
  app: AppId;
  size?: number;
  decorativo?: boolean;
};

export function IconoApp({ app, size = 24, decorativo = true }: IconoAppProps) {
  const info = APPS[app];
  const src = `${import.meta.env.BASE_URL}${info.rutaLogo}`;
  
  return (
    <img
      src={src}
      alt={decorativo ? '' : info.nombre}
      aria-hidden={decorativo}
      width={size}
      height={size}
      className="object-contain select-none"
    />
  );
}
