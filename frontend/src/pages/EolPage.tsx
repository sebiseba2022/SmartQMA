import type { Language } from '../types';

interface StationPageProps {
  lang: Language;
}

export function EolPage({ lang }: StationPageProps) {
  return (
    <div className="station-content-wrapper">
      <div className="station-banner-card">
        <div className="station-code-pill">WS-EOL-08</div>
        <h2 className="station-headline">
          {lang === 'ro' ? 'Punct de verificare — EOL' : 'Inspection point — EOL'}
        </h2>
        <p className="station-description">
          {lang === 'ro'
            ? 'Testare funcțională finală (End-Of-Line), programare firmware, testare comunicație și semnale electrice.'
            : 'End-of-line functional testing, firmware flashing, communications verification, and power-up validation.'}
        </p>
      </div>
      <div className="station-workspace-area blank-page-white">
        {/* Spațiu pregătit pentru testarea funcțională EOL */}
      </div>
    </div>
  );
}

export default EolPage;
