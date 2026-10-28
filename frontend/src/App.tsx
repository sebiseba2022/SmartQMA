import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { WORKSTATIONS, STATS_MODEL_PAGES, translations, type Language } from './i18n';
import './App.css';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface WarehouseOrder {
  id: number;
  internal_id: number;
  ident: string;
  part_name: string;
  ordered_at: string;
  quantity: number;
  arrived: boolean;
  arrival_time: string | null;
  tracking_number: string | null;
  provider: string | null;
}

const ARDUINO_COMPONENT_IDENTS = [
  { ident: '10002', name: 'ATmega328P (Microcontroler 8-bit AVR)' },
  { ident: '10003', name: 'ATmega16U2 (Controller USB-la-Serial)' },
  { ident: '10004', name: 'NCP1117ST50T3G (Regulator LDO 5.0V)' },
  { ident: '10005', name: 'LP2985-33DBVR (Regulator LDO 3.3V)' },
  { ident: '10006', name: 'LMV358IDGKR (Amplificator Operațional Dual)' },
  { ident: '10007', name: 'FDN340P (Tranzistor MOSFET Canal-P)' },
  { ident: '10008', name: 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)' },
  { ident: '10009', name: 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)' },
];

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatDateOnly(isoString: string | null | undefined): string {
  if (!isoString) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentLocalDateTimeInput(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function getCurrentDateInput(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
// 2. ZONA DE STOCARE - MAGAZIE (STILIZARE STANDARD, MENIU CLICK DREAPTA)
// =========================================================================
function MagaziePage({ lang }: { lang: Language }) {
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formular comanda noua (toate campurile completate)
  const [ident, setIdent] = useState('10002');
  const [quantity, setQuantity] = useState('500');
  const [orderedAt, setOrderedAt] = useState(() => getCurrentLocalDateTimeInput());
  const [provider, setProvider] = useState('Mouser Electronics');
  const [trackingNumber, setTrackingNumber] = useState('DHL-884920199');
  const [arrived, setArrived] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(() => getCurrentDateInput());

  // Stare meniu contextual (click dreapta pe nume / rand)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    order: WarehouseOrder;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/inventory', {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Eroare la încărcarea comenzilor din magazie.');
      }
      setOrders(Array.isArray(json.data) ? json.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Inchidere meniu contextual la click oriunde sau tasta Escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseInt(quantity, 10);
    if (
      !ident.trim() ||
      Number.isNaN(qtyNum) ||
      qtyNum < 1 ||
      !provider.trim() ||
      !trackingNumber.trim() ||
      !orderedAt ||
      !arrivalTime
    ) {
      setError(
        lang === 'ro'
          ? 'Toate câmpurile sunt obligatorii.'
          : 'All fields are required.'
      );
      return;
    }

    const selectedComp = ARDUINO_COMPONENT_IDENTS.find((c) => c.ident === ident);

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ident: ident.trim(),
          part_name: selectedComp ? selectedComp.name : `Componentă #${ident.trim()}`,
          ordered_at: new Date(orderedAt).toISOString(),
          quantity: qtyNum,
          provider: provider.trim(),
          tracking_number: trackingNumber.trim(),
          arrived,
          arrival_time: arrivalTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Eroare la salvarea comenzii.');
      }

      setOrderedAt(getCurrentLocalDateTimeInput());
      setArrivalTime(getCurrentDateInput());
      await fetchOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la salvarea comenzii.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowContextMenu = (e: React.MouseEvent, order: WarehouseOrder) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      order,
    });
  };

  const handleSetArrival = async (order: WarehouseOrder, targetArrived: boolean) => {
    setContextMenu(null);
    try {
      const res = await fetch(`/api/v1/inventory/${order.id}/arrival`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          arrived: targetArrived,
          arrival_time: formatDateOnly(order.arrival_time),
        }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch {
      // ignore
    }
  };

  const handleCancelOrder = async (order: WarehouseOrder) => {
    setContextMenu(null);
    try {
      const res = await fetch(`/api/v1/inventory/${order.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch {
      // ignore
    }
  };

  const handleCopyTrackingNumber = async (order: WarehouseOrder) => {
    setContextMenu(null);
    const tracking = order.tracking_number || '';
    if (!tracking) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tracking);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = tracking;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
    } catch {
      // ignore
    }
  };

  return (
    <main className="magazie-standard-container">
      <div className="magazie-standard-wrapper">
        <h1 className="magazie-page-title">
          {lang === 'ro'
            ? 'Zona de stocare - Magazie (Comenzi Componente)'
            : 'Storage Area - Warehouse (Component Orders)'}
        </h1>

        {/* Formular standard pentru plasare comanda */}
        <section className="magazie-section-box">
          <h2 className="magazie-section-heading">
            {lang === 'ro' ? 'Înregistrare Comandă Nouă' : 'Register New Component Order'}
          </h2>

          {error && <div className="magazie-standard-error">{error}</div>}

          <form onSubmit={handleCreateOrder} className="magazie-order-form">
            <div className="magazie-form-field">
              <label htmlFor="mag-ident">Ident Componentă</label>
              <select
                id="mag-ident"
                value={ident}
                onChange={(e) => setIdent(e.target.value)}
                disabled={submitting}
              >
                {ARDUINO_COMPONENT_IDENTS.map((item) => (
                  <option key={item.ident} value={item.ident}>
                    {item.ident} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-qty">{lang === 'ro' ? 'Cantitate' : 'Quantity'}</label>
              <input
                id="mag-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-ordered-at">
                {lang === 'ro' ? 'Data Comenzii' : 'Order Date'}
              </label>
              <input
                id="mag-ordered-at"
                type="datetime-local"
                value={orderedAt}
                onChange={(e) => setOrderedAt(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-provider">
                {lang === 'ro' ? 'Provider (Furnizor)' : 'Provider (Supplier)'}
              </label>
              <input
                id="mag-provider"
                type="text"
                placeholder="ex: Mouser Electronics"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-tracking">Tracking Number</label>
              <input
                id="mag-tracking"
                type="text"
                placeholder="ex: DHL-884920145"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-arrived">
                {lang === 'ro' ? 'Ajuns în depozit?' : 'Arrived in warehouse?'}
              </label>
              <select
                id="mag-arrived"
                value={arrived ? 'da' : 'nu'}
                onChange={(e) => setArrived(e.target.value === 'da')}
                disabled={submitting}
              >
                <option value="nu">{lang === 'ro' ? 'Nu (În tranzit)' : 'No (In transit)'}</option>
                <option value="da">{lang === 'ro' ? 'Da (Sosit)' : 'Yes (Arrived)'}</option>
              </select>
            </div>

            <div className="magazie-form-field">
              <label htmlFor="mag-arrival-time">Arrival Time (Data)</label>
              <input
                id="mag-arrival-time"
                type="date"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="magazie-form-actions">
              <button type="submit" className="magazie-btn-submit" disabled={submitting}>
                {submitting
                  ? lang === 'ro'
                    ? 'Se salvează...'
                    : 'Saving...'
                  : lang === 'ro'
                    ? 'Plasează Comanda'
                    : 'Place Order'}
              </button>
            </div>
          </form>
        </section>

        {/* Tabel standard cu comenzile de componente pentru Arduino Uno R3 */}
        <section className="magazie-section-box">
          <div className="magazie-table-header-row">
            <h2 className="magazie-section-heading">
              {lang === 'ro'
                ? 'Registru Comenzi Componente (Arduino Uno R3)'
                : 'Component Orders Registry (Arduino Uno R3)'}
            </h2>
            <span className="magazie-count-label">
              {lang === 'ro'
                ? `Click dreapta pe nume pentru acțiuni • Total înregistrări: ${orders.length}`
                : `Right-click on name for actions • Total records: ${orders.length}`}
            </span>
          </div>

          {loading ? (
            <p className="magazie-loading-text">
              {lang === 'ro' ? 'Se încarcă datele...' : 'Loading data...'}
            </p>
          ) : (
            <div className="magazie-table-scroll">
              <table className="magazie-standard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ident</th>
                    <th>{lang === 'ro' ? 'Componentă' : 'Component'}</th>
                    <th>{lang === 'ro' ? 'Data Comenzii' : 'Ordered At'}</th>
                    <th>{lang === 'ro' ? 'Cantitate' : 'Quantity'}</th>
                    <th>{lang === 'ro' ? 'Provider (Furnizor)' : 'Provider'}</th>
                    <th>Tracking Number</th>
                    <th>{lang === 'ro' ? 'Ajuns în Depozit' : 'Arrived'}</th>
                    <th>Arrival Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="magazie-empty-cell">
                        {lang === 'ro'
                          ? 'Nu există comenzi înregistrate.'
                          : 'No orders recorded.'}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className="magazie-context-row"
                        onContextMenu={(e) => handleRowContextMenu(e, order)}
                        title={
                          lang === 'ro'
                            ? 'Click dreapta pentru acțiuni (Confirmă sosirea / Anulează sosirea / Anulează comanda)'
                            : 'Right-click for actions'
                        }
                      >
                        <td>{idx + 1}</td>
                        <td className="magazie-ident-cell">{order.ident || order.internal_id}</td>
                        <td className="magazie-name-cell">{order.part_name}</td>
                        <td>{formatDateTime(order.ordered_at)}</td>
                        <td>{order.quantity} buc.</td>
                        <td>{order.provider}</td>
                        <td className="magazie-mono-cell">{order.tracking_number}</td>
                        <td>
                          <span
                            className={`magazie-status-label ${
                              order.arrived ? 'arrived-yes' : 'arrived-no'
                            }`}
                          >
                            {order.arrived
                              ? lang === 'ro'
                                ? 'Da'
                                : 'Yes'
                              : lang === 'ro'
                                ? 'Nu'
                                : 'No'}
                          </span>
                        </td>
                        <td>{formatDateOnly(order.arrival_time)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Meniu contextual la click dreapta pe nume / rand */}
      {contextMenu && (
        <div
          className="magazie-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="magazie-context-menu-header">
            {contextMenu.order.ident} — {contextMenu.order.part_name}
          </div>
          <button
            type="button"
            className="magazie-context-menu-item"
            onClick={() => handleSetArrival(contextMenu.order, true)}
          >
            {lang === 'ro' ? 'Confirmă sosirea' : 'Confirm arrival'}
          </button>
          <button
            type="button"
            className="magazie-context-menu-item"
            onClick={() => handleSetArrival(contextMenu.order, false)}
          >
            {lang === 'ro' ? 'Anulează sosirea' : 'Cancel arrival'}
          </button>
          <button
            type="button"
            className="magazie-context-menu-item"
            onClick={() => handleCopyTrackingNumber(contextMenu.order)}
          >
            {lang === 'ro' ? 'Copiază tracking number' : 'Copy tracking number'}
          </button>
          <div className="magazie-context-menu-divider" />
          <button
            type="button"
            className="magazie-context-menu-item danger"
            onClick={() => handleCancelOrder(contextMenu.order)}
          >
            {lang === 'ro' ? 'Anulează comanda' : 'Cancel order'}
          </button>
        </div>
      )}
    </main>
  );
}

// =========================================================================
// 3. PAGINA SEPARATĂ PENTRU FIECARE POST DE LUCRU
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
  const isMagazie = currentWs.id === 'magazie';

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
      ) : isMagazie ? (
        <MagaziePage lang={lang} />
      ) : (
        /* Pe celelalte posturi de lucru: complet alb, nimic afișat, doar topnavbarul */
        <main className="blank-page-white"></main>
      )}
    </div>
  );
}

// =========================================================================
// 4. ROOT APP CU ROUTING
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
