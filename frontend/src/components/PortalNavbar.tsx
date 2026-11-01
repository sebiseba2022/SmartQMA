import { useState } from 'react';
import type { Language, User } from '../types';
import type { WorkstationDef } from '../i18n';

interface PortalNavbarProps {
  lang?: Language;
  onLangChange?: (newLang: Language) => void;
  currentWs: WorkstationDef;
  currentUser?: User | null;
  onLogout: () => void;
}

export function PortalNavbar({
  currentWs,
  onLogout,
}: PortalNavbarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <header className="portal-navbar">
        {/* Stânga: Logo oficial SmartQMA + Separator subtil + Numele postului curent */}
        <div className="navbar-brand">
          <div
            className="logo-wrapper-small logo-static"
            title="SmartQMA — Traceability at its finest"
          >
            <img src="/logo-tight.png" alt="SmartQMA Logo" className="navbar-logo-img" />
          </div>

          <div className="navbar-divider-accent" />

          <div className="navbar-station-info">
            <span className="navbar-station-name">{currentWs.name.ro}</span>
          </div>
        </div>

        {/* Dreapta: Doar butonul ✕ de deconectare, fără text și fără badge de funcție */}
        <div className="navbar-right-actions">
          <button
            type="button"
            className="btn-logout-x"
            onClick={() => setShowLogoutModal(true)}
            title="Deconectare"
            aria-label="Deconectare"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Dialog de confirmare deconectare centrat pe ecran */}
      {showLogoutModal && (
        <div
          className="logout-modal-backdrop"
          onClick={() => setShowLogoutModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="logout-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-icon-wrap">
              <span className="logout-modal-warn-icon">!</span>
            </div>
            <h3 className="logout-modal-title">Deconectare</h3>
            <p className="logout-modal-message">
              Sunteți sigur că doriți să vă deconectați?
            </p>
            <div className="logout-modal-actions">
              <button
                type="button"
                className="btn-logout-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Anulează
              </button>
              <button
                type="button"
                className="btn-logout-confirm"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
              >
                Confirmă
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PortalNavbar;
