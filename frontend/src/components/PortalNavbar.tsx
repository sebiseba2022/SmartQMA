import type { Language, User } from '../types';
import type { WorkstationDef } from '../i18n';

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
  return (
    <header className="portal-navbar">
      {/* Stânga: Logo + Numele postului de lucru curent */}
      <div className="navbar-brand">
        <div className="logo-wrapper-small">
          <img src="/logo-transparent.png" alt="Logo SmartQMA" className="navbar-logo-img" />
        </div>
        <span className="navbar-station-name">{currentWs.name[lang]}</span>
      </div>

      {/* Dreapta: Selector discret RO/EN + Utilizator curent + Buton 'X' pentru Deconectare */}
      <div className="navbar-right-actions">
        {currentUser && (
          <div className="navbar-user-chip" title={`Rol: ${currentUser.role}`}>
            <span className="navbar-user-name">{currentUser.name}</span>
            <span className="navbar-user-role">({currentUser.role})</span>
          </div>
        )}

        <div className="lang-switcher-discreet" title="Language">
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

        <button
          type="button"
          className="btn-logout-x"
          onClick={onLogout}
          title={lang === 'ro' ? 'Deconectare' : 'Disconnect'}
          aria-label="Disconnect"
        >
          ✕
        </button>
      </div>
    </header>
  );
}

export default PortalNavbar;
