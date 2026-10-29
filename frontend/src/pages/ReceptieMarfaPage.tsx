import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function ReceptieMarfaPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-REC-02</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Punct de verificare — Recepție marfă' : 'Inspection point — Goods receipt'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Control de calitate la intrare, recepție loturi de componente și verificare conformitate furnizor.'
            : 'Incoming quality control, component batch reception, and supplier conformity verification.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru fluxul de recepție marfă */}
      </div>
    </div>
  );
}

export default ReceptieMarfaPage;
