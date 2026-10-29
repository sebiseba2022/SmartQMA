import {
  useState,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type { Language, User, IctResultItem } from '../types';
import { useRealtimeLiveFeed } from '../utils/useRealtimeLiveFeed';
import { LiveStreamFreezeBanner } from '../components/LiveStreamFreezeBanner';

interface IctPageProps {
  lang: Language;
  currentUser?: User | null;
}

interface IctFilters {
  qr_serial_number: string;
  test_result: string;
  failed_nets: string;
  operator_username: string;
}

const EMPTY_FILTERS: IctFilters = {
  qr_serial_number: '',
  test_result: '',
  failed_nets: '',
  operator_username: '',
};

const MIN_EMPTY_TABLE_ROWS = 22;

export function IctPage({ lang, currentUser }: IctPageProps) {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Funcție de preluare date pentru hook-ul de flux live
  const fetchResultsCallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/tests/ict?limit=50');
      if (!res.ok) throw new Error('Eroare la încărcarea testelor ICT');
      const data = await res.json();
      setTotalCount(data.total || (data.data ? data.data.length : 0));
      return data.data || [];
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea testelor ICT.');
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
  } = useRealtimeLiveFeed<IctResultItem>({
    fetchFn: fetchResultsCallback,
    intervalMs: 2500,
  });

  // Filtre pe coloane
  const [filters, setFilters] = useState<IctFilters>(EMPTY_FILTERS);

  // Bară rapidă
  const [quickPcbSerial, setQuickPcbSerial] = useState<string>('');

  // Modale
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<IctResultItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formular test ICT nou
  const [formSerial, setFormSerial] = useState('');
  const [formResult, setFormResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [form5v, setForm5v] = useState('5.01V');
  const [form3v3, setForm3v3] = useState('3.30V');
  const [formFreq, setFormFreq] = useState('16.000MHz');
  const [formVccGnd, setFormVccGnd] = useState('>100k');
  const [formFailedNets, setFormFailedNets] = useState('');

  // Salvare test ICT nou
  const handleRecordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSerial = formSerial.trim();
    if (!cleanSerial) return;

    const measuredValues = {
      U5_VOUT: form5v,
      U2_VOUT: formResult === 'FAIL' && !formFailedNets ? 'SHORT' : form3v3,
      Y1_FREQ: formFreq,
      VCC_GND: formVccGnd,
    };

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/tests/ict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-ICT-07',
          qr_serial_number: cleanSerial,
          test_result: formResult,
          measured_values: measuredValues,
          failed_nets: formResult === 'FAIL' ? formFailedNets || 'NET_3V3_SHORT' : null,
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la salvare.');

      setNotice(
        lang === 'ro'
          ? `Testul electric ICT pentru PCB ${cleanSerial} a fost înregistrat: ${formResult}.`
          : `ICT test for PCB ${cleanSerial} recorded: ${formResult}.`
      );
      setIsRecordModalOpen(false);
      setFormSerial('');
      setFormFailedNets('');
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
      const res = await fetch('/api/v1/tests/ict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-ICT-07',
          qr_serial_number: cleanSerial,
          test_result: verdict,
          measured_values:
            verdict === 'PASS'
              ? { U5_VOUT: '5.01V', U2_VOUT: '3.30V', Y1_FREQ: '16.000MHz', VCC_GND: '>100k' }
              : { U5_VOUT: '5.01V', U2_VOUT: 'SHORT' },
          failed_nets: verdict === 'FAIL' ? 'NET_3V3_SHORT' : null,
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare.');

      setNotice(
        lang === 'ro'
          ? `PCB ${cleanSerial} marcat cu ${verdict} la patul de ace ICT.`
          : `PCB ${cleanSerial} marked as ${verdict} at ICT bed of nails.`
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
      if (filters.test_result && r.test_result !== filters.test_result) {
        return false;
      }
      if (
        filters.failed_nets &&
        !(r.failed_nets || '').toLowerCase().includes(filters.failed_nets.toLowerCase())
      ) {
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

  // Formatare compactă a valorilor măsurate
  const formatMeasuredValues = (mv: any) => {
    if (!mv || typeof mv !== 'object') return '—';
    return Object.entries(mv)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Nr_Crt',
      'Serie_PCB',
      'Rezultat_Test',
      'Noduri_Esuate',
      'Valori_Masurate',
      'Operator',
      'Data_Testare',
      'Statie',
    ];
    const rows = filteredResults.map((r, idx) => [
      idx + 1,
      r.qr_serial_number,
      r.test_result,
      `"${r.failed_nets || ''}"`,
      `"${formatMeasuredValues(r.measured_values).replace(/"/g, '""')}"`,
      r.operator_username || '',
      r.tested_at,
      r.station_id,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teste_ict_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga */}
      <aside className="magazie-left-rail" aria-label="Acțiuni ICT">
        <div className="magazie-rail-group">
          {/* Test electric nou */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              title={lang === 'ro' ? 'Înregistrează test electric ICT' : 'Record ICT electrical test'}
              onClick={() => setIsRecordModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Test nou' : 'New test'}
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

        {/* Bară rapidă ICT */}
        <section className="station-quick-bar" aria-label="Operare rapidă ICT">
          <div className="station-quick-group">
            <span className="station-quick-label">
              {lang === 'ro' ? 'Verificare pat de ace PCB:' : 'Bed of nails PCB check:'}
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
              <span>{lang === 'ro' ? 'Rată trecere ICT:' : 'ICT Pass Rate:'}</span>
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
              <span>{lang === 'ro' ? 'Total testate:' : 'Total tested:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Punct de verificare ICT — Testare electrică în circuit pe pat de ace (Bed of Nails)'
              : 'ICT Inspection Point — In-Circuit Electrical Testing (Bed of Nails Fixture)'}
          </span>
          <span className="magazie-count-badge">
            {lang === 'ro'
              ? `${filteredResults.length} din ${totalCount} teste electrice afișate`
              : `${filteredResults.length} of ${totalCount} electrical tests displayed`}
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
                <th style={{ width: '155px' }}>{lang === 'ro' ? 'Serie PCB' : 'PCB Serial'}</th>
                <th style={{ width: '85px' }}>{lang === 'ro' ? 'Rezultat' : 'Verdict'}</th>
                <th style={{ width: '130px' }}>{lang === 'ro' ? 'Noduri eșuate' : 'Failed nets'}</th>
                <th style={{ minWidth: '160px' }}>
                  {lang === 'ro' ? 'Măsurători electrice (V / Freq / R)' : 'Electrical measurements'}
                </th>
                <th style={{ width: '105px' }}>{lang === 'ro' ? 'Operator' : 'Operator'}</th>
                <th style={{ width: '140px' }}>{lang === 'ro' ? 'Data testării' : 'Tested at'}</th>
                <th style={{ width: '85px', textAlign: 'center' }}>
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
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder="NET_3V3..."
                    value={filters.failed_nets}
                    onChange={(e) => setFilters({ ...filters, failed_nets: e.target.value })}
                  />
                </td>
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
                  <td>
                    <span
                      className={`status-badge ${r.test_result === 'PASS' ? 'pass' : 'fail'}`}
                    >
                      {r.test_result}
                    </span>
                  </td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 600, color: r.failed_nets ? '#b91c1c' : '#64748b' }}>
                    {r.failed_nets || '—'}
                  </td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#334155' }}>
                    {formatMeasuredValues(r.measured_values)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal: Înregistrare test ICT */}
      {isRecordModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsRecordModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Înregistrare test electric ICT' : 'Record ICT test'}
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
                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
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
                  <label>{lang === 'ro' ? 'Rezultat test electric*' : 'Test verdict*'}</label>
                  <select
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value as any)}
                  >
                    <option value="PASS">PASS (Conform)</option>
                    <option value="FAIL">FAIL (Scurtcircuit / Circuit deschis)</option>
                  </select>
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Tensiune LDO 5V (U5)' : '5V Rail (U5)'}</label>
                  <input
                    type="text"
                    value={form5v}
                    onChange={(e) => setForm5v(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Tensiune LDO 3.3V (U2)' : '3.3V Rail (U2)'}</label>
                  <input
                    type="text"
                    value={form3v3}
                    onChange={(e) => setForm3v3(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Frecvență rezonator (Y1)' : 'Oscillator freq (Y1)'}</label>
                  <input
                    type="text"
                    value={formFreq}
                    onChange={(e) => setFormFreq(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Izolație VCC-GND' : 'VCC-GND isolation'}</label>
                  <input
                    type="text"
                    value={formVccGnd}
                    onChange={(e) => setFormVccGnd(e.target.value)}
                  />
                </div>

                {formResult === 'FAIL' && (
                  <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                    <label>{lang === 'ro' ? 'Noduri / trasee eșuate*' : 'Failed nets*'}</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: NET_3V3_SHORT, NET_RESET_OPEN"
                      value={formFailedNets}
                      onChange={(e) => setFormFailedNets(e.target.value)}
                    />
                  </div>
                )}
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
                    ? 'Confirmă rezultat ICT'
                    : 'Confirm ICT test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalii test ICT */}
      {selectedResult && (
        <div className="magazie-modal-backdrop" onClick={() => setSelectedResult(null)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Fișă testare electrică ICT' : 'ICT electrical test card'}
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
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Rezultat:' : 'Verdict:'}</span>
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

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Noduri / trasee eșuate:' : 'Failed nets:'}</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: selectedResult.failed_nets ? '#b91c1c' : '#15803d' }}>
                  {selectedResult.failed_nets || '— (Fără trasee eșuate)'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Valori electrice măsurate la patul de ace:' : 'Measured values:'}</span>
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
                  {formatMeasuredValues(selectedResult.measured_values)}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Operator:' : 'Operator:'}</span>
                <div>{selectedResult.operator_username || '—'}</div>
              </div>

              <div>
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

export default IctPage;
