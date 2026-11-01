import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function ExportPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <h2 className="station-headline">
          {lang === 'ro' ? 'Zona de scanare — Export' : 'Scanning area — Export'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Scanare finală pentru trasabilitate completă, generare rapoarte de lot, ambalare antistatică și pregătire expediere.'
            : 'Final QR serial scanning for full traceability, batch report generation, ESD packaging, and shipping preparation.'}
        </p>
      </div>

      <div className="station-workspace-area">
        <div className="blank-page-white" />
      </div>
    </div>
  );
}

export default ExportPage;
