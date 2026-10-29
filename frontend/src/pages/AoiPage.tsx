import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function AoiPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-AOI-05</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Punct de verificare — AOI' : 'Inspection point — AOI'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Inspecție optică automată post-reflow pentru verificarea lipiturilor, alinierii și orientării componentelor SMD.'
            : 'Post-reflow automated optical inspection for solder joints, component orientation, and placement accuracy.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru stația de inspecție optică AOI */}
      </div>
    </div>
  );
}

export default AoiPage;
