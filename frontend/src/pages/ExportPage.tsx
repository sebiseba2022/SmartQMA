import type { Language } from '../types';

interface StationPageProps {
  lang?: Language;
}

export function ExportPage(_props: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <h2 className="station-headline">
          Zona de scanare — Export
        </h2>
        <p className="station-description">
          Scanare finală pentru trasabilitate completă, generare rapoarte de lot, ambalare antistatică și pregătire expediere.
        </p>
      </div>

      <div className="station-workspace-area">
        <div className="blank-page-white" />
      </div>
    </div>
  );
}

export default ExportPage;
