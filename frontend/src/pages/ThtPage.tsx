import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function ThtPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-THT-06</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Zona de amplasare — THT' : 'Placement area — THT'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Inserție manuală a componentelor Through-Hole, lipire pe val (wave soldering) sau manuală și inspecție vizuală.'
            : 'Manual through-hole component insertion, wave or hand soldering, and initial visual check.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru postul de asamblare THT */}
      </div>
    </div>
  );
}

export default ThtPage;
