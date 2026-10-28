import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { WORKSTATIONS, STATS_MODEL_PAGES, translations, type Language } from './i18n';
import './App.css';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

// =========================================================================
// 1. ECRANUL DE LOGIN (Split Screen 2 Coloane, Dropdown pentru mutare pe pagina postului)
// =========================================================================
function LoginPage({
  lang,
  onLangChange,
  onLoginSuccess,
}: {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  onLoginSuccess: (user: User, stationId: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStation, setSelectedStation] = useState(WORKSTATIONS[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(t.validationRequired);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.authErrorDefault);
      }

      // Verificare acces pe bază de rol (ex: pe Statistică au acces doar director și owner)
      const targetStation = WORKSTATIONS.find((w) => w.id === selectedStation);
      if (targetStation && !targetStation.allowedRoles.includes(data.user.role)) {
        throw new Error(t.statisticaAccessDenied);
      }

      onLoginSuccess(data.user, selectedStation);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.authErrorDefault);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string) => {
    setUsername(user);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="login-split-layout">
      {/* Coloana Stânga: Banner Cald cu Logo oficial SmartQMA (fading & umbră) */}
      <div className="login-left-banner">
        <div className="banner-top-brand">
          <div className="logo-wrapper-hero">
            <img src="/logo-transparent.png" alt="SmartQMA Logo" className="hero-logo-img" />
          </div>
        </div>

        <div className="banner-center-content">
          <div className="red-accent-line"></div>
          <h1 className="banner-headline">{t.bannerHeadline}</h1>
        </div>

        <div className="banner-footer">{t.bannerFooter}</div>
      </div>

      {/* Coloana Dreapta: Formular Autentificare cu Dropdown Posturi */}
      <div className="login-right-panel">
        <div className="top-lang-bar">
          <div className="lang-switcher-discreet" title="Select language">
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
        </div>

        <div className="login-card-container">
          <h2 className="login-card-title">{t.authPortalTitle}</h2>
          <p className="login-card-subtitle">{t.authPortalSubtitle}</p>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="auth-username">{t.usernameLabel}</label>
              <input
                id="auth-username"
                type="text"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="auth-password">{t.passwordLabel}</label>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Dropdown-ul cu cele 10 posturi de lucru */}
            <div className="auth-form-group">
              <label htmlFor="auth-station">{t.stationLabel}</label>
              <select
                id="auth-station"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                disabled={loading}
              >
                {WORKSTATIONS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            {/* Autofill rapid pentru conturile de test */}
            <div className="test-autofill-box">
              <span className="autofill-label">{t.testAutofillLabel}</span>
              <div className="autofill-buttons-row">
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('owner')}
                >
                  Owner
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('director')}
                >
                  Director
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('engineer')}
                >
                  Engineer
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('operator')}
                >
                  Operator
                </button>
              </div>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? t.signingIn : t.signInButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. PAGINA SEPARATĂ PENTRU FIECARE POST DE LUCRU (+ MENIU STÂNGA DOAR PE STATISTICĂ)
// =========================================================================
function WorkstationPage({
  lang,
  onLangChange,
  currentUser,
  onLogout,
}: {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  currentUser: User | null;
  onLogout: () => void;
}) {
  const { stationId, subPageId } = useParams<{ stationId?: string; subPageId?: string }>();
  const navigate = useNavigate();
  const t = translations[lang];

  // Verificare dacă utilizatorul este autentificat; dacă nu, redirecționare la login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const effectiveStationId = stationId || 'statistica';
  const currentWs = WORKSTATIONS.find((w) => w.id === effectiveStationId);

  // Dacă postul nu este valid, redirecționare la login
  if (!currentWs) {
    return <Navigate to="/" replace />;
  }

  const hasAccess = currentWs.allowedRoles.includes(currentUser.role);
  const isStatistics = currentWs.id === 'statistica';

  // Pentru Statistică, validăm sub-pagina activă (pagina-1 ... pagina-6)
  const validSubPage = STATS_MODEL_PAGES.find((p) => p.id === subPageId);
  if (isStatistics && hasAccess && subPageId && !validSubPage) {
    return <Navigate to="/statistica/pagina-1" replace />;
  }
  const activeStatsPageId = validSubPage ? validSubPage.id : STATS_MODEL_PAGES[0].id;

  return (
    <div className="station-page-layout">
      {/* Top Navbar */}
      <header className="portal-navbar">
        {/* Stânga: Logo + Numele postului de lucru curent */}
        <div className="navbar-brand">
          <div className="logo-wrapper-small">
            <img src="/logo-transparent.png" alt="Logo" className="navbar-logo-img" />
          </div>
          <span className="navbar-station-name">{currentWs.name[lang]}</span>
        </div>

        {/* Dreapta: Selector discret RO/EN + Buton 'X' pentru Deconectare */}
        <div className="navbar-right-actions">
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

      {/* Verificare acces pe bază de rol (ex: doar Director și Owner pe Statistică) */}
      {!hasAccess ? (
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
      ) : isStatistics ? (
        /* Pagina Statistică: Meniu în stânga cu Pagina 1 ... Pagina 6 (toate goale momentan) */
        <div className="stats-workspace-layout">
          <aside className="stats-sidebar" aria-label={t.statsMenuTitle}>
            <div className="stats-sidebar-header">{t.statsMenuTitle}</div>
            <nav className="stats-sidebar-nav">
              {STATS_MODEL_PAGES.map((page) => {
                const isActive = activeStatsPageId === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    className={`stats-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(`/statistica/${page.id}`)}
                  >
                    <span className="stats-nav-dot" />
                    <span className="stats-nav-text">{page.name[lang]}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Conținutul fiecărei pagini de opțiuni este complet gol momentan */}
          <main className="blank-page-white"></main>
        </div>
      ) : (
        /* Pe celelalte posturi de lucru: complet alb, nimic afișat, doar topnavbarul */
        <main className="blank-page-white"></main>
      )}
    </div>
  );
}

// =========================================================================
// 3. ROOT APP CU ROUTING
// =========================================================================
function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('smartqma_lang');
      return savedLang === 'en' ? 'en' : 'ro';
    } catch {
      return 'ro';
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('smartqma_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('smartqma_lang', newLang);
    } catch {
      // ignore
    }
  };

  const handleLoginSuccess = (user: User, stationId: string, navigate: (path: string) => void) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('smartqma_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    if (stationId === 'statistica') {
      navigate('/statistica/pagina-1');
    } else {
      navigate('/' + stationId);
    }
  };

  const handleLogout = (navigate: (path: string) => void) => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('smartqma_auth_user');
    } catch {
      // ignore
    }
    navigate('/');
  };

  return (
    <BrowserRouter>
      <AppRoutes
        lang={lang}
        onLangChange={handleLangChange}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

function AppRoutes({
  lang,
  onLangChange,
  currentUser,
  onLoginSuccess,
  onLogout,
}: {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, stationId: string, navigate: (path: string) => void) => void;
  onLogout: (navigate: (path: string) => void) => void;
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginPage
            lang={lang}
            onLangChange={onLangChange}
            onLoginSuccess={(user, stationId) => onLoginSuccess(user, stationId, navigate)}
          />
        }
      />

      <Route
        path="/statistica/:subPageId"
        element={
          <WorkstationPage
            lang={lang}
            onLangChange={onLangChange}
            currentUser={currentUser}
            onLogout={() => onLogout(navigate)}
          />
        }
      />

      <Route
        path="/:stationId"
        element={
          <WorkstationPage
            lang={lang}
            onLangChange={onLangChange}
            currentUser={currentUser}
            onLogout={() => onLogout(navigate)}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
