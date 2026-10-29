import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function ExportPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-EXP-09</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Zona de scanare — Export' : 'Scanning area — Export'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Scanare finală pentru trasabilitate completă, generare rapoarte de lot, ambalare antistatică și pregătire expediere.'
            : 'Final QR serial scanning for full traceability, batch report generation, ESD packaging, and shipping preparation.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru zona de ambalare și expediere export */}
      </div>
    </div>
  );
}

export default ExportPage;
