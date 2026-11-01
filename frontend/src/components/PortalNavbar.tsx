import type { Language, User } from '../types';
import type { WorkstationDef } from '../i18n';
import { ROLE_NAMES } from '../i18n';

interface PortalNavbarProps {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  currentWs: WorkstationDef;
  currentUser: User | null;
  onLogout: () => void;
}

export function PortalNavbar({
  lang,
  onLangChange,
  currentWs,
  currentUser,
  onLogout,
}: PortalNavbarProps) {
  const roleDisplay = currentUser
    ? ROLE_NAMES[currentUser.role]?.[lang] || currentUser.role
    : '';

  return (
    <header className="portal-navbar">
      {/* Stânga: Logo oficial SmartQMA + Separator subtil + Numele postului curent */}
      <div className="navbar-brand">
        <a href="/" className="logo-wrapper-small" title="SmartQMA — Traceability at its finest">
          <img src="/logo-tight.png" alt="SmartQMA Logo" className="navbar-logo-img" />
        </a>

        <div className="navbar-divider-accent" />

        <div className="navbar-station-info">
          <span className="navbar-station-name">{currentWs.name[lang]}</span>
        </div>
      </div>

      {/* Dreapta: Informații utilizator activ, comutator limbă RO/EN și buton deconectare */}
      <div className="navbar-right-actions">
        {currentUser && (
          <div className="navbar-user-chip" title={`Rol: ${roleDisplay}`}>
            <span className="user-status-dot cobalt" />
            <span className="navbar-user-name">{currentUser.name}</span>
            <span className="navbar-user-role">({roleDisplay})</span>
          </div>
        )}

        {/* Comutator discret RO / EN */}
        <div className="lang-switcher-discreet" title="Language selection">
          <button
            type="button"
            className={`lang-btn-discreet ${lang === 'ro' ? 'active' : ''}`}
            onClick={() => onLangChange('ro')}
          >
            RO
          </button>
          <span className="lang-sep-discreet">/</span>
          <button
            type="button"
            className={`lang-btn-discreet ${lang === 'en' ? 'active' : ''}`}
            onClick={() => onLangChange('en')}
          >
            EN
          </button>
        </div>

        {/* Buton Deconectare elegant, rotund cu contur bordeaux */}
        <button
          type="button"
          className="btn-logout-pill"
          onClick={onLogout}
          title={lang === 'ro' ? 'Deconectare din sesiune' : 'Log out from session'}
          aria-label="Logout"
        >
          <span className="logout-icon">✕</span>
          <span className="logout-text">{lang === 'ro' ? 'Ieșire' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
}

export default PortalNavbar;
