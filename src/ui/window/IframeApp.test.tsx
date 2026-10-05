import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IframeApp } from './IframeApp';

describe('IframeApp', () => {
  it('muestra estado de carga y luego el iframe al cargar', () => {
    render(<IframeApp url="https://pomofocus.io/" nombreApp="TimeLapse" />);

    expect(screen.getByRole('status', { name: 'Cargando TimeLapse' })).toBeInTheDocument();

    const iframe = screen.getByTitle('TimeLapse');
    expect(iframe).toHaveAttribute('src', 'https://pomofocus.io/');
    expect(iframe).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
    );

    fireEvent.load(iframe);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Ábrela en una pestaña nueva/i });
    expect(link).toHaveAttribute('href', 'https://pomofocus.io/');
  });
});
