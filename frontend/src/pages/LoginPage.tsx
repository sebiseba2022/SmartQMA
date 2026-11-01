import { useState, type FormEvent } from 'react';
import type { Language, User } from '../types';
import { WORKSTATIONS, translations } from '../i18n';
import { EyeIcon, EyeOffIcon } from '../components/icons/IndustrialIcons';
import TraceabilityGraphic from '../components/TraceabilityGraphic';

interface LoginPageProps {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  onLoginSuccess: (user: User, stationId: string) => void;
}

export function LoginPage({
  lang,
  onLangChange,
  onLoginSuccess,
}: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStation, setSelectedStation] = useState(WORKSTATIONS[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleLogin = async (e: FormEvent) => {
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
          Accept: 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.authErrorDefault);
      }

      // Verificare acces pe bază de rol
      const targetStation = WORKSTATIONS.find((w) => w.id === selectedStation);
      if (targetStation && !targetStation.allowedRoles.includes(data.user.role)) {
        throw new Error(
          lang === 'ro'
            ? `Acces refuzat: Rolul «${data.user.role}» nu are permisiunea de a accesa postul «${targetStation.name.ro}».`
            : `Access denied: Role "${data.user.role}" is not authorized for workstation "${targetStation.name.en}".`
        );
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

  const handleQuickFill = (user: string, defaultStation?: string) => {
    setUsername(user);
    setPassword('Password123!');
    if (defaultStation) {
      setSelectedStation(defaultStation);
    }
    setError(null);
  };

  return (
    <div className="login-split-layout">
      {/* Coloana Stânga: Design elegant, aerisit, abundență de alb, grafic de trasabilitate */}
      <div className="login-left-banner">
        <div className="banner-top-brand">
          <div className="logo-wrapper-hero">
            <img src="/logo-transparent.png" alt="SmartQMA Logo" className="hero-logo-img" />
          </div>
        </div>

        <div className="banner-center-content">
          <div className="banner-bordeaux-accent">
            <span className="accent-cobalt-dot" />
            <span className="accent-line-bordeaux" />
          </div>

          <h1 className="banner-headline">
            {lang === 'ro'
              ? 'Soluții inteligente pentru trasabilitate completă'
              : 'Intelligent solutions for complete traceability'}
          </h1>

          <p className="banner-description">
            {lang === 'ro'
              ? 'SmartQMA integrează fiecare post de fabricație: de la primirea componentelor și marcarea QR laser, până la asamblarea SMD/THT, inspecția calității AOI/ICT/EOL și expediție.'
              : 'SmartQMA unifies every manufacturing station: from raw components intake and QR laser marking, through SMD/THT assembly, AOI/ICT/EOL quality inspection, to final shipping.'}
          </p>

          <div className="banner-graphic-container">
            <TraceabilityGraphic size={310} />
          </div>

          {/* Repere de valoare discrete cu accente cobalt și bordeaux */}
          <div className="banner-features-row">
            <div className="banner-feature-item">
              <span className="feature-node-dot cobalt" />
              <span className="feature-text">
                {lang === 'ro' ? 'Trasabilitate per PCB' : 'Per-PCB Traceability'}
              </span>
            </div>
            <div className="banner-feature-item">
              <span className="feature-node-dot bordeaux" />
              <span className="feature-text">
                {lang === 'ro' ? 'Control Calitate 100%' : '100% Quality Control'}
              </span>
            </div>
            <div className="banner-feature-item">
              <span className="feature-node-dot cobalt" />
              <span className="feature-text">
                {lang === 'ro' ? 'Securitate Coduri de Bare' : 'Barcode Badge Security'}
              </span>
            </div>
          </div>
        </div>

        <div className="banner-footer">
          <span>{t.bannerFooter}</span>
          <span className="banner-footer-tagline">
            {lang === 'ro' ? 'Eleganță & Precizie Industrială' : 'Elegance & Industrial Precision'}
          </span>
        </div>
      </div>

      {/* Coloana Dreapta: Formular Autentificare curat, luminos, cu butoane stilizate bordeaux */}
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
          <div className="login-card-header">
            <span className="login-portal-badge">
              <span className="badge-pulse-dot" />
              {lang === 'ro' ? 'Acces Securizat Producție' : 'Secure Production Access'}
            </span>
            <h2 className="login-card-title">{t.authPortalTitle}</h2>
            <p className="login-card-subtitle">{t.authPortalSubtitle}</p>
          </div>

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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            {/* Dropdown-ul cu cele 11 posturi de lucru */}
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
                    {w.name[lang]} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Autofill rapid pentru conturile de test - Stil Butoane Pill Elegante */}
            <div className="test-autofill-box">
              <span className="autofill-label">
                <span className="autofill-cobalt-dot" />
                {t.testAutofillLabel}
              </span>
              <div className="autofill-buttons-row">
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('owner', 'statistica')}
                  title="Proprietar (Owner)"
                >
                  Proprietar
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('director', 'statistica')}
                  title="Director Fabricație"
                >
                  Director
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('engineer', 'plm')}
                  title="Inginer Proces & Calitate"
                >
                  Inginer
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('magazioner', 'magazie')}
                  title="Responsabil Magazie"
                >
                  Magazioner
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('analist_calitate', 'receptie-marfa')}
                  title="Analist Calitate"
                >
                  Calitate
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('operator_smd', 'smd')}
                  title="Operator SMD"
                >
                  Op. SMD
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('operator_aoi', 'aoi')}
                  title="Operator AOI"
                >
                  Op. AOI
                </button>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleQuickFill('operator', 'qr-laser')}
                  title="Operator Producție"
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

export default LoginPage;
