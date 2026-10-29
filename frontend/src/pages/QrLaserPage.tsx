import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function QrLaserPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-LSR-03</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Zona de marcare — QR Laser' : 'Marking area — QR Laser'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Inscripționare coduri QR unice de trasabilitate pe plăcile PCB înainte de asamblare.'
            : 'Unique traceability QR code engraving on PCB panels prior to component assembly.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru stația de marcare laser */}
      </div>
    </div>
  );
}

export default QrLaserPage;
