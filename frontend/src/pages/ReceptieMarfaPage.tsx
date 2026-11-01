import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function ReceptieMarfaPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <h2 className="station-headline">
          {lang === 'ro' ? 'Punct de verificare — Recepție marfă' : 'Inspection point — Goods receipt'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Control de calitate la intrare, recepție loturi de componente și verificare conformitate furnizor.'
            : 'Incoming quality control, component batch reception, and supplier conformity verification.'}
        </p>
      </div>

      <div className="station-workspace-area">
        <div className="blank-page-white" />
      </div>
    </div>
  );
}

export default ReceptieMarfaPage;
