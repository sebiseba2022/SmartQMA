import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function IctPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-ICT-07</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Punct de verificare — ICT' : 'Inspection point — ICT'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Testare electrică în circuit cu pat de ace (bed-of-nails) pentru scurtcircuite, valori rezistive și capacități.'
            : 'In-circuit electrical bed-of-nails testing for shorts, opens, component values, and tolerances.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru postul de testare ICT */}
      </div>
    </div>
  );
}

export default IctPage;
