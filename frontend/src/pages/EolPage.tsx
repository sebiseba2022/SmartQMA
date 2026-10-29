import {
  useState,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type { Language, User, EolResultItem } from '../types';
import { useRealtimeLiveFeed } from '../utils/useRealtimeLiveFeed';
import { LiveStreamFreezeBanner } from '../components/LiveStreamFreezeBanner';

interface EolPageProps {
  lang: Language;
  currentUser?: User | null;
}

interface EolFilters {
  qr_serial_number: string;
  product_ident: string;
  test_result: string;
  operator_username: string;
}

const EMPTY_FILTERS: EolFilters = {
  qr_serial_number: '',
  product_ident: '',
  test_result: '',
  operator_username: '',
};

const MIN_EMPTY_TABLE_ROWS = 22;

export function EolPage({ lang, currentUser }: EolPageProps) {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Funcție de preluare date pentru hook-ul de flux live
  const fetchResultsCallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/tests/eol?limit=50');
      if (!res.ok) throw new Error('Eroare la încărcarea testelor EOL');
      const data = await res.json();
      setTotalCount(data.total || (data.data ? data.data.length : 0));
      return data.data || [];
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea testelor EOL.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook flux realtime cu înghețare la derulare
  const {
    items: results,
    pendingNewCount,
    recentNewIds,
    containerRef,
    handleScroll,
    resumeLiveStream,
    refreshNow: fetchResults,
  } = useRealtimeLiveFeed<EolResultItem>({
    fetchFn: fetchResultsCallback,
    intervalMs: 2500,
  });

  // Filtre pe coloane
  const [filters, setFilters] = useState<EolFilters>(EMPTY_FILTERS);

  // Bară rapidă
  const [quickPcbSerial, setQuickPcbSerial] = useState<string>('');

  // Modale
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<EolResultItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formular test EOL nou
  const [formSerial, setFormSerial] = useState('');
  const [formProductIdent, setFormProductIdent] = useState('ARDUINO_UNO_R3');
  const [formResult, setFormResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [formCurrentDraw, setFormCurrentDraw] = useState('47.85');
  const [formUsbCheck, setFormUsbCheck] = useState(true);
  const [formBootloaderCheck, setFormBootloaderCheck] = useState(true);
  const [formUartLoopback, setFormUartLoopback] = useState(true);
  const [formGpioPass, setFormGpioPass] = useState(true);

  // Salvare test EOL nou
  const handleRecordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSerial = formSerial.trim();
    if (!cleanSerial) return;

    const functionalChecks = {
      usb_enumeration: formUsbCheck,
      bootloader_checksum: formBootloaderCheck ? 'OK' : 'MISMATCH',
      uart_loopback: formUartLoopback,
      adc_reference_v: 5.01,
      gpio_all_pass: formGpioPass,
    };

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/tests/eol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-EOL-08',
          qr_serial_number: cleanSerial,
          product_ident: formProductIdent,
          test_result: formResult,
          current_draw_ma: parseFloat(formCurrentDraw) || 47.85,
          functional_checks: functionalChecks,
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la salvare.');

      setNotice(
        lang === 'ro'
          ? `Testul funcțional final EOL pentru PCB ${cleanSerial} a fost înregistrat: ${formResult}.`
          : `EOL functional test for PCB ${cleanSerial} recorded: ${formResult}.`
      );
      setIsRecordModalOpen(false);
      setFormSerial('');
      fetchResults();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Marcaj rapid din bară
  const handleQuickVerdict = async (verdict: 'PASS' | 'FAIL') => {
    const cleanSerial = quickPcbSerial.trim();
    if (!cleanSerial) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/tests/eol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-EOL-08',
          qr_serial_number: cleanSerial,
          product_ident: 'ARDUINO_UNO_R3',
          test_result: verdict,
          current_draw_ma: verdict === 'PASS' ? 47.85 : 124.5,
          functional_checks: {
            usb_enumeration: verdict === 'PASS',
            bootloader_checksum: verdict === 'PASS' ? 'OK' : 'FAIL',
            uart_loopback: verdict === 'PASS',
            adc_reference_v: 5.01,
            gpio_all_pass: verdict === 'PASS',
          },
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare.');

      setNotice(
        lang === 'ro'
          ? `PCB ${cleanSerial} testat la EOL: ${verdict}.`
          : `PCB ${cleanSerial} tested at EOL: ${verdict}.`
      );
      setQuickPcbSerial('');
      fetchResults();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Statistici
  const passCount = useMemo(() => results.filter((r) => r.test_result === 'PASS').length, [results]);
  const failCount = useMemo(() => results.filter((r) => r.test_result === 'FAIL').length, [results]);
  const fpyRate = useMemo(() => {
    if (results.length === 0) return '100.0%';
    return `${((passCount / results.length) * 100).toFixed(1)}%`;
  }, [results, passCount]);

  // Filtrare tabel
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (
        filters.qr_serial_number &&
        !r.qr_serial_number.toLowerCase().includes(filters.qr_serial_number.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.product_ident &&
        !r.product_ident.toLowerCase().includes(filters.product_ident.toLowerCase())
      ) {
        return false;
      }
      if (filters.test_result && r.test_result !== filters.test_result) {
        return false;
      }
      if (
        filters.operator_username &&
        !(r.operator_username || '').toLowerCase().includes(filters.operator_username.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [results, filters]);

  const emptyRowsCount = Math.max(0, MIN_EMPTY_TABLE_ROWS - filteredResults.length);

  // Formatare compactă verificări funcționale
  const formatChecks = (fc: any) => {
    if (!fc || typeof fc !== 'object') return '—';
    const items = [];
    if (fc.usb_enumeration) items.push('USB: OK');
    if (fc.uart_loopback) items.push('UART: OK');
    if (fc.bootloader_checksum) items.push(`Flash: ${fc.bootloader_checksum}`);
    if (fc.gpio_all_pass) items.push('GPIO: PASS');
    return items.join(' | ') || 'OK';
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Nr_Crt',
      'Serie_PCB',
      'Model_Produs',
      'Versiune_HW',
      'Versiune_SW',
      'Rezultat_Test',
      'Curent_Absorbit_mA',
      'Operator',
      'Data_Testare',
    ];
    const rows = filteredResults.map((r, idx) => [
      idx + 1,
      r.qr_serial_number,
      r.product_ident,
      r.hardware_version,
      r.software_version,
      r.test_result,
      r.current_draw_ma || '',
      r.operator_username || '',
      r.tested_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teste_eol_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga */}
      <aside className="magazie-left-rail" aria-label="Acțiuni EOL">
        <div className="magazie-rail-group">
          {/* Test funcțional nou */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              title={lang === 'ro' ? 'Înregistrează test funcțional EOL' : 'Record EOL test'}
              onClick={() => setIsRecordModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Test EOL' : 'EOL test'}
            </span>
          </div>

          {/* Filtru doar FAIL */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className={`magazie-round-btn ${filters.test_result === 'FAIL' ? 'active' : ''}`}
              title={lang === 'ro' ? 'Afișează doar teste eșuate (FAIL)' : 'Show failed tests only'}
              onClick={() =>
                setFilters({
                  ...filters,
                  test_result: filters.test_result === 'FAIL' ? '' : 'FAIL',
                })
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Doar FAIL' : 'FAIL only'}
            </span>
          </div>

          {/* Reîmprospătează lista */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Reîmprospătează lista' : 'Refresh list'}
              onClick={fetchResults}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Reîmprospătare' : 'Refresh'}
            </span>
          </div>

          {/* Export CSV */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Exportă CSV' : 'Export CSV'}
              onClick={handleExportCsv}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Exportă CSV' : 'Export CSV'}
            </span>
          </div>
        </div>
      </aside>

      {/* Zona principală */}
      <main className="magazie-table-fullpage">
        {error && (
          <div className="magazie-table-notice" style={{ background: '#fef2f2', color: '#991b1b' }}>
            <span>{error}</span>
            <button type="button" className="magazie-notice-close" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}
        {notice && (
          <div className="magazie-table-notice" style={{ background: '#ecfdf5', color: '#065f46' }}>
            <span>{notice}</span>
            <button type="button" className="magazie-notice-close" onClick={() => setNotice(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Bară rapidă EOL */}
        <section className="station-quick-bar" aria-label="Operare rapidă EOL">
          <div className="station-quick-group">
            <span className="station-quick-label">
              {lang === 'ro' ? 'Testare finală PCB:' : 'Final PCB test:'}
            </span>
            <input
              type="text"
              className="station-quick-input"
              placeholder="ex: 261029000001"
              value={quickPcbSerial}
              onChange={(e) => setQuickPcbSerial(e.target.value)}
            />
            <button
              type="button"
              className="station-quick-btn"
              style={{ background: '#16a34a' }}
              disabled={submitting || !quickPcbSerial.trim()}
              onClick={() => handleQuickVerdict('PASS')}
            >
              ✓ PASS
            </button>
            <button
              type="button"
              className="station-quick-btn"
              style={{ background: '#dc2626' }}
              disabled={submitting || !quickPcbSerial.trim()}
              onClick={() => handleQuickVerdict('FAIL')}
            >
              ✕ FAIL
            </button>
          </div>

          <div className="station-kpi-group">
            <div className="station-kpi-chip success">
              <span>{lang === 'ro' ? 'Rată finală EOL:' : 'EOL Pass Rate:'}</span>
              <strong>{fpyRate}</strong>
            </div>
            <div className="station-kpi-chip">
              <span>PASS:</span>
              <strong style={{ color: '#4ade80' }}>{passCount}</strong>
            </div>
            <div className="station-kpi-chip danger">
              <span>FAIL:</span>
              <strong>{failCount}</strong>
            </div>
            <div className="station-kpi-chip">
              <span>{lang === 'ro' ? 'Total validate:' : 'Total validated:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Punct de verificare EOL — Testare funcțională finală, consum curent & certificare produs'
              : 'EOL Inspection Point — End-Of-Line Functional Testing, Current Draw & Certification'}
          </span>
          <span className="magazie-count-badge">
            {lang === 'ro'
              ? `${filteredResults.length} din ${totalCount} teste funcționale afișate`
              : `${filteredResults.length} of ${totalCount} functional tests displayed`}
          </span>
        </div>

        {/* Banner de avertizare la derulare - înghețare flux live */}
        <LiveStreamFreezeBanner
          pendingCount={pendingNewCount}
          onResume={resumeLiveStream}
          lang={lang}
        />

        {/* Tabel */}
        <div className="magazie-fulltable-container" ref={containerRef} onScroll={handleScroll}>
          <table className="magazie-pro-table">
            <thead>
              <tr>
                <th className="col-idx" style={{ width: '65px' }}>#</th>
                <th style={{ width: '150px' }}>{lang === 'ro' ? 'Serie PCB' : 'PCB Serial'}</th>
                <th style={{ width: '135px' }}>{lang === 'ro' ? 'Model produs' : 'Product model'}</th>
                <th style={{ width: '105px' }}>{lang === 'ro' ? 'Versiuni HW / SW' : 'HW / SW Vers'}</th>
                <th style={{ width: '80px' }}>{lang === 'ro' ? 'Rezultat' : 'Verdict'}</th>
                <th style={{ width: '95px' }}>{lang === 'ro' ? 'Curent (mA)' : 'Current (mA)'}</th>
                <th style={{ minWidth: '150px' }}>
                  {lang === 'ro' ? 'Verificări funcționale' : 'Functional checks'}
                </th>
                <th style={{ width: '100px' }}>{lang === 'ro' ? 'Operator' : 'Operator'}</th>
                <th style={{ width: '140px' }}>{lang === 'ro' ? 'Data testării' : 'Tested at'}</th>
                <th style={{ width: '80px', textAlign: 'center' }}>
                  {lang === 'ro' ? 'Detalii' : 'Details'}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Rând interogare */}
              <tr className="magazie-query-row">
                <td className="magazie-query-idx-cell">⌕</td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input ident-input"
                    placeholder={lang === 'ro' ? 'Filtrează serie...' : 'Filter serial...'}
                    value={filters.qr_serial_number}
                    onChange={(e) =>
                      setFilters({ ...filters, qr_serial_number: e.target.value })
                    }
                  />
                </td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder="ARDUINO..."
                    value={filters.product_ident}
                    onChange={(e) => setFilters({ ...filters, product_ident: e.target.value })}
                  />
                </td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell">
                  <select
                    className="magazie-cell-input"
                    value={filters.test_result}
                    onChange={(e) => setFilters({ ...filters, test_result: e.target.value })}
                  >
                    <option value="">{lang === 'ro' ? 'Toate' : 'All'}</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder="Operator..."
                    value={filters.operator_username}
                    onChange={(e) =>
                      setFilters({ ...filters, operator_username: e.target.value })
                    }
                  />
                </td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell"></td>
              </tr>

              {filteredResults.map((r) => (
                <tr
                  key={r.id}
                  className={`magazie-data-row ${recentNewIds.has(r.id) ? 'row-cascade-new' : ''}`}
                  onClick={() => setSelectedResult(r)}
                >
                  <td className="col-idx-cell" style={{ fontWeight: 700, color: '#64748b' }}>
                    #{r.id}
                  </td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 700, color: '#ea580c' }}>
                    {r.qr_serial_number}
                  </td>
                  <td className="magazie-name-cell">{r.product_ident}</td>
                  <td className="magazie-mono-cell" style={{ fontSize: '11.5px', color: '#475569' }}>
                    {r.hardware_version} / {r.software_version}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${r.test_result === 'PASS' ? 'pass' : 'fail'}`}
                    >
                      {r.test_result}
                    </span>
                  </td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 600 }}>
                    {r.current_draw_ma ? `${r.current_draw_ma} mA` : '—'}
                  </td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#334155' }}>
                    {formatChecks(r.functional_checks)}
                  </td>
                  <td>{r.operator_username || '—'}</td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#64748b' }}>
                    {r.tested_at ? new Date(r.tested_at).toLocaleString('ro-RO') : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="quick-fill-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResult(r);
                      }}
                    >
                      {lang === 'ro' ? 'Detalii' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}

              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`blank-${i}`} className="magazie-blank-row">
                  <td className="col-idx-cell">—</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal: Înregistrare test EOL */}
      {isRecordModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsRecordModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Înregistrare testare funcțională finală EOL' : 'Record EOL functional test'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsRecordModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit}>
              <div className="magazie-modal-form">
                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Serie placă PCB (12 cifre)*' : 'PCB serial (12 digits)*'}</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="ex: 261029000001"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Model produs*' : 'Product model*'}</label>
                  <input
                    type="text"
                    value={formProductIdent}
                    onChange={(e) => setFormProductIdent(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Rezultat test final*' : 'Final verdict*'}</label>
                  <select
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value as any)}
                  >
                    <option value="PASS">PASS (Certificat pentru livrare)</option>
                    <option value="FAIL">FAIL (Respins / Necesită reparație)</option>
                  </select>
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Consum curent (mA)*' : 'Current draw (mA)*'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCurrentDraw}
                    onChange={(e) => setFormCurrentDraw(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{lang === 'ro' ? 'Baterie verificări funcționale' : 'Functional checks checklist'}</label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formUsbCheck}
                        onChange={(e) => setFormUsbCheck(e.target.checked)}
                      />
                      Enumerare USB & Comunicație VID/PID OK
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formBootloaderCheck}
                        onChange={(e) => setFormBootloaderCheck(e.target.checked)}
                      />
                      Integritate flash & bootloader CRC valid
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formUartLoopback}
                        onChange={(e) => setFormUartLoopback(e.target.checked)}
                      />
                      Buclă UART TX/RX Loopback la 115200 baud conformă
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formGpioPass}
                        onChange={(e) => setFormGpioPass(e.target.checked)}
                      />
                      Comutare pini digitali D0-D13 și canale analogice A0-A5 PASS
                    </label>
                  </div>
                </div>
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsRecordModalOpen(false)}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || !formSerial.trim()}
                >
                  {submitting
                    ? lang === 'ro'
                      ? 'Se salvează...'
                      : 'Saving...'
                    : lang === 'ro'
                    ? 'Confirmă rezultat EOL'
                    : 'Confirm EOL test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalii certificat EOL */}
      {selectedResult && (
        <div className="magazie-modal-backdrop" onClick={() => setSelectedResult(null)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Certificat testare funcțională EOL' : 'EOL test certificate'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setSelectedResult(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Serie PCB:' : 'PCB Serial:'}</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ea580c' }}>
                  {selectedResult.qr_serial_number}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Rezultat final:' : 'Final verdict:'}</span>
                <div>
                  <span
                    className={`status-badge ${
                      selectedResult.test_result === 'PASS' ? 'pass' : 'fail'
                    }`}
                  >
                    {selectedResult.test_result}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Model produs:' : 'Product model:'}</span>
                <div style={{ fontWeight: 700 }}>{selectedResult.product_ident}</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Versiuni HW / SW:' : 'HW / SW Vers:'}</span>
                <div style={{ fontFamily: 'monospace' }}>
                  {selectedResult.hardware_version} / {selectedResult.software_version}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Consum curent nominal:' : 'Current draw:'}</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {selectedResult.current_draw_ma} mA
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Operator:' : 'Operator:'}</span>
                <div>{selectedResult.operator_username || '—'}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Verificări funcționale trecute:' : 'Checks summary:'}</span>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {formatChecks(selectedResult.functional_checks)}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Data testării:' : 'Tested at:'}</span>
                <div>
                  {selectedResult.tested_at
                    ? new Date(selectedResult.tested_at).toLocaleString('ro-RO')
                    : '—'}
                </div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setSelectedResult(null)}
              >
                {lang === 'ro' ? 'Închide' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EolPage;
