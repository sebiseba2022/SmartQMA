import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function SmdPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-SMD-04</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Zona de amplasare — SMD' : 'Placement area — SMD'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Alimentare feedere mașini pick-and-place, asamblare pe suprafață și monitorizare retete componente SMD.'
            : 'Pick-and-place feeder loading, surface mount assembly, and SMD component recipe monitoring.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru stația de asamblare SMD */}
      </div>
    </div>
  );
}

export default SmdPage;
