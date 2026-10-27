import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { WORKSTATIONS, translations, type Language } from './i18n';
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
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.authErrorDefault);
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
          <p className="banner-description">{t.bannerDescription}</p>
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
// 2. PAGINA SEPARATĂ PENTRU FIECARE POST DE LUCRU
// Conform cerinței:
// - Pagini complet separate (URL dedicat)
// - Fără coloana din stânga (nu poți trece din magazie în alt post)
// - Sus în navbar: Logo + NUMELE POSTULUI DE LUCRU (fără textul alb "SmartQMA")
// - În dreapta: butonul RO/EN discret + buton 'X' pentru deconectare (fără cine este logat)
// - Pe pagină: complet ALB, nimic afișat, doar topnavbarul!
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
  const { stationId } = useParams<{ stationId: string }>();

  // Verificare dacă utilizatorul este autentificat; dacă nu, redirecționare la login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const currentWs = WORKSTATIONS.find((w) => w.id === stationId);

  // Dacă postul nu este valid, redirecționare la login
  if (!currentWs) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="station-page-layout">
      {/* Top Navbar */}
      <header className="portal-navbar">
        {/* Stânga: Logo + Numele postului de lucru curent (fără textul alb 'SmartQMA') */}
        <div className="navbar-brand">
          <div className="logo-wrapper-small">
            <img src="/logo-transparent.png" alt="Logo" className="navbar-logo-img" />
          </div>
          <span className="navbar-station-name">{currentWs.name[lang]}</span>
        </div>

        {/* Dreapta: Selector discret RO/EN + Buton 'X' pentru Deconectare (fără nume utilizator) */}
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

      {/* Pe pagină este complet alb, nimic afișat, doar topnavbarul */}
      <main className="blank-page-white"></main>
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
    navigate('/' + stationId);
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
