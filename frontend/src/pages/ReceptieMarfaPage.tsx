import type { Language } from '../types';

interface StationPageProps {
  lang?: Language;
}

export function ReceptieMarfaPage(_props: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <h2 className="station-headline">
          Punct de verificare — Recepție marfă
        </h2>
        <p className="station-description">
          Control de calitate la intrare, recepție loturi de componente și verificare conformitate furnizor.
        </p>
      </div>

      <div className="station-workspace-area">
        <div className="blank-page-white" />
      </div>
    </div>
  );
}

export default ReceptieMarfaPage;
