import type { Language } from '../types';
import { translations } from '../i18n';

interface RestrictedAccessProps {
  lang: Language;
  onLogout: () => void;
}

export function RestrictedAccess({ lang, onLogout }: RestrictedAccessProps) {
  const t = translations[lang];

  return (
    <main className="restricted-access-container">
      <div className="restricted-access-card">
        <div className="restricted-badge">403</div>
        <h2 className="restricted-title">{t.restrictedAccessTitle}</h2>
        <p className="restricted-message">{t.statisticaAccessDenied}</p>
        <button type="button" className="btn-signin" onClick={onLogout}>
          {t.backToLogin}
        </button>
      </div>
    </main>
  );
}

export default RestrictedAccess;
