import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type { Language, User, QrLaserMarkingItem } from '../types';
import { useRealtimeLiveFeed } from '../utils/useRealtimeLiveFeed';
import { LiveStreamFreezeBanner } from '../components/LiveStreamFreezeBanner';

interface QrLaserPageProps {
  lang?: Language;
  currentUser?: User | null;
}

interface QrLaserFilters {
  qr_serial_number: string;
  product_model: string;
  pcb_side: string;
  operator_username: string;
  status: string;
}

const EMPTY_FILTERS: QrLaserFilters = {
  qr_serial_number: '',
  product_model: '',
  pcb_side: '',
  operator_username: '',
  status: '',
};

const MIN_EMPTY_TABLE_ROWS = 22;

export function QrLaserPage({ currentUser }: QrLaserPageProps) {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Informații despre următoarea serie automată
  const [nextSerialInfo, setNextSerialInfo] = useState<{
    prefix: string;
    sequence: number;
    next_serial: string;
    production_date: string;
  } | null>(null);

  // Preluare următoarea serie automată din 12 cifre
  const fetchNextSerial = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/laser/next-serial');
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'success') {
        setNextSerialInfo(data);
      }
    } catch {
      // eroare ignorată pe fundal
    }
  }, []);

  // Funcție de preluare date pentru hook-ul de flux live
  const fetchMarkingsCallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/laser/markings?limit=50');
      if (!res.ok) throw new Error('Eroare la încărcarea marcajelor laser');
      const data = await res.json();
      setTotalCount(data.total || (data.data ? data.data.length : 0));
      // Menținem actualizat și următorul serial
      fetchNextSerial();
      return data.data || [];
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea marcajelor.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchNextSerial]);

  // Hook flux realtime cu înghețare la derulare
  const {
    items: markings,
    pendingNewCount,
    recentNewIds,
    containerRef,
    handleScroll,
    resumeLiveStream,
    refreshNow: fetchMarkings,
  } = useRealtimeLiveFeed<QrLaserMarkingItem>({
    fetchFn: fetchMarkingsCallback,
    intervalMs: 2500,
  });

  // Filtre pe coloane
  const [filters, setFilters] = useState<QrLaserFilters>(EMPTY_FILTERS);

  // Bare rapide de acțiune
  const [quickManualSerial, setQuickManualSerial] = useState<string>('');
  const [quickRescanInput, setQuickRescanInput] = useState<string>('');

  // Modale
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRescanModalOpen, setIsRescanModalOpen] = useState(false);
  const [selectedMarking, setSelectedMarking] = useState<QrLaserMarkingItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulare
  const [manualSerialForm, setManualSerialForm] = useState('');
  const [manualModelForm, setManualModelForm] = useState('ARDUINO_UNO_R3');
  const [manualSideForm, setManualSideForm] = useState<'TOP' | 'BOTTOM'>('TOP');
  const [manualLaserPower, setManualLaserPower] = useState('85.0');
  const [manualDuration, setManualDuration] = useState('420');
  const [manualNotes, setManualNotes] = useState('');

  const [rescanSerialInput, setRescanSerialInput] = useState('');
  const [rescanNotesInput, setRescanNotesInput] = useState('');
  const [rescanTraceabilityData, setRescanTraceabilityData] = useState<any | null>(null);

  useEffect(() => {
    fetchNextSerial();
  }, [fetchNextSerial]);

  // Executare marcare automată (+1)
  const handleAutoMark = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/laser/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_model: manualModelForm,
          pcb_side: manualSideForm,
          laser_power_pct: parseFloat(manualLaserPower) || 85.0,
          mark_duration_ms: parseInt(manualDuration, 10) || 420,
          operator_username: currentUser?.username || 'operator',
          notes: 'Gravare secvențială automată (+1)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Eroare la gravarea automată.');
      }

      setNotice(
        `Placa PCB a fost marcată cu succes cu seria ${data.data?.qr_serial_number}.`);
      setIsAutoModalOpen(false);
      fetchMarkings();
      fetchNextSerial();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Salvare marcare manuală cu 12 cifre
  const handleManualMarkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSerial = manualSerialForm.trim();

    if (!/^\d{12}$/.test(cleanSerial)) {
      setError(
        'Seria trebuie să conțină exact 12 cifre (format: YYMMDD + 6 cifre secvență).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/laser/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_serial_number: cleanSerial,
          product_model: manualModelForm,
          pcb_side: manualSideForm,
          laser_power_pct: parseFloat(manualLaserPower) || 85.0,
          mark_duration_ms: parseInt(manualDuration, 10) || 420,
          operator_username: currentUser?.username || 'operator',
          notes: manualNotes.trim() || 'Introdus manual de operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Eroare la înregistrarea seriei.');
      }

      setNotice(
        `Seria manuală ${cleanSerial} a fost înregistrată cu succes.`);
      setIsManualModalOpen(false);
      setManualSerialForm('');
      setManualNotes('');
      fetchMarkings();
      fetchNextSerial();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Trimitere rapidă serie manuală din bara de sus
  const handleQuickManualSubmit = async () => {
    const cleanSerial = quickManualSerial.trim();
    if (!/^\d{12}$/.test(cleanSerial)) {
      setError(
        'Seria manuală rapidă trebuie să conțină exact 12 cifre numerice.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/laser/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_serial_number: cleanSerial,
          product_model: 'ARDUINO_UNO_R3',
          pcb_side: 'TOP',
          laser_power_pct: 85.0,
          mark_duration_ms: 420,
          operator_username: currentUser?.username || 'operator',
          notes: 'Introducere rapidă pe linie',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la salvare.');

      setNotice(
        `Seria ${cleanSerial} a fost gravată și adăugată în tabel.`);
      setQuickManualSerial('');
      fetchMarkings();
      fetchNextSerial();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Rescanare piesă
  const handleRescanSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanSerial = (rescanSerialInput || quickRescanInput).trim();
    if (!cleanSerial) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/laser/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_serial_number: cleanSerial,
          operator_username: currentUser?.username || 'operator',
          notes: rescanNotesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la rescanare.');

      // Încercăm să obținem și istoricul complet de trasabilitate
      try {
        const traceRes = await fetch(`/api/v1/traceability/scan/${cleanSerial}`);
        if (traceRes.ok) {
          const traceData = await traceRes.json();
          setRescanTraceabilityData(traceData);
        }
      } catch {
        // ignorare eroare trasabilitate secundară
      }

      setNotice(data.message);
      setQuickRescanInput('');
      fetchMarkings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrare tabel pe client
  const filteredMarkings = useMemo(() => {
    return markings.filter((m) => {
      if (
        filters.qr_serial_number &&
        !m.qr_serial_number.toLowerCase().includes(filters.qr_serial_number.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.product_model &&
        !m.product_model.toLowerCase().includes(filters.product_model.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.pcb_side &&
        !m.pcb_side.toLowerCase().includes(filters.pcb_side.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.operator_username &&
        !(m.operator_username || '').toLowerCase().includes(filters.operator_username.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && m.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [markings, filters]);

  // Număr rânduri goale pentru completare vizuală
  const emptyRowsCount = Math.max(0, MIN_EMPTY_TABLE_ROWS - filteredMarkings.length);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Nr_Crt',
      'Numar_Serie_12_Cifre',
      'Model_Produs',
      'Fata_PCB',
      'Putere_Laser_Pct',
      'Durata_Ms',
      'Operator',
      'Data_Marcare',
      'Status',
      'Note',
    ];
    const rows = filteredMarkings.map((m, idx) => [
      idx + 1,
      m.qr_serial_number,
      m.product_model,
      m.pcb_side,
      m.laser_power_pct,
      m.mark_duration_ms,
      m.operator_username || '',
      m.marked_at,
      m.status,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marcare_qr_laser_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga: Butoane rotunde de acțiune */}
      <aside className="magazie-left-rail" aria-label="Acțiuni QR Laser">
        <div className="magazie-rail-group">
          {/* Gravare automată (+1) */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              title={
                `Gravare automată (+1): ${nextSerialInfo?.next_serial || 'Generare serie'}`}
              onClick={() => setIsAutoModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {'Gravare (+1)'}
            </span>
          </div>

          {/* Introducere manuală serie 12 cifre */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={'Introducere serie manuală'}
              onClick={() => setIsManualModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {'Serie manuală'}
            </span>
          </div>

          {/* Rescanare / verificare piesă */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={'Rescanează / verifică PCB'}
              onClick={() => setIsRescanModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2M9 9h6v6H9V9z"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {'Rescanare QR'}
            </span>
          </div>

          {/* Reîmprospătează lista */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={'Reîmprospătează datele'}
              onClick={() => {
                fetchMarkings();
                fetchNextSerial();
              }}
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
              {'Reîmprospătare'}
            </span>
          </div>

          {/* Export CSV */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={'Exportă tabelul în CSV'}
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
              {'Exportă CSV'}
            </span>
          </div>
        </div>
      </aside>

      {/* Zona principală: Tabel complet */}
      <main className="magazie-table-fullpage">
        {/* Notificare eroare sau succes */}
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

        {/* Bară rapidă de scanare și introducere manuală */}
        <section className="station-quick-bar" aria-label="Introducere rapidă și scanare">
          <div className="station-quick-group">
            <span className="station-quick-label">
              {'Introducere manuală (12 cifre):'}
            </span>
            <input
              type="text"
              maxLength={12}
              className="station-quick-input"
              placeholder={nextSerialInfo?.next_serial || 'YYMMDDxxxxxx'}
              value={quickManualSerial}
              onChange={(e) => setQuickManualSerial(e.target.value.replace(/\D/g, '').slice(0, 12))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickManualSubmit();
              }}
            />
            <button
              type="button"
              className="station-quick-btn"
              disabled={submitting || quickManualSerial.length !== 12}
              onClick={handleQuickManualSubmit}
            >
              {'Marchează serie'}
            </button>
          </div>

          <div className="station-quick-group">
            <span className="station-quick-label">
              {'Rescanează piesă QR:'}
            </span>
            <input
              type="text"
              className="station-quick-input"
              placeholder={'Scanează sau tastează cod...'}
              value={quickRescanInput}
              onChange={(e) => setQuickRescanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRescanSubmit();
              }}
            />
            <button
              type="button"
              className="station-quick-btn secondary"
              disabled={submitting || !quickRescanInput.trim()}
              onClick={() => handleRescanSubmit()}
            >
              {'Rescanează'}
            </button>
          </div>

          {/* Indicatori de stare producție (KPI chips) */}
          <div className="station-kpi-group">
            <div className="station-kpi-chip">
              <span>{'Data producției:'}</span>
              <strong>{nextSerialInfo?.prefix || '261029'}</strong>
            </div>
            <div className="station-kpi-chip success">
              <span>{'Următoarea serie (+1):'}</span>
              <strong>{nextSerialInfo?.next_serial || '261029000001'}</strong>
            </div>
            <div className="station-kpi-chip">
              <span>{'Total plăci gravate:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {'Stația de gravare laser DataMatrix 2D — trasabilitate unică PCB'}
          </span>
          <span className="magazie-count-badge">
            {`${filteredMarkings.length} din ${totalCount} plăci PCB afișate`}
          </span>
        </div>

        {/* Banner de avertizare la derulare - înghețare flux live */}
        <LiveStreamFreezeBanner
          pendingCount={pendingNewCount}
          onResume={resumeLiveStream}

        />

        {/* Tabel profesional pe tot ecranul */}
        <div className="magazie-fulltable-container" ref={containerRef} onScroll={handleScroll}>
          <table className="magazie-pro-table">
            <thead>
              <tr>
                <th className="col-idx" style={{ width: '65px' }}>#</th>
                <th style={{ width: '145px' }}>
                  {'Număr serie (12 cifre)'}
                </th>
                <th style={{ width: '135px' }}>
                  {'Model produs'}
                </th>
                <th style={{ width: '75px' }}>{'Față'}</th>
                <th style={{ width: '140px' }}>
                  {'Data și ora marcării'}
                </th>
                <th style={{ width: '90px' }}>
                  {'Putere laser (%)'}
                </th>
                <th style={{ width: '85px' }}>
                  {'Durată (ms)'}
                </th>
                <th style={{ width: '100px' }}>{'Operator'}</th>
                <th style={{ width: '85px' }}>{'Status'}</th>
                <th style={{ minWidth: '130px' }}>{'Note / detalii'}</th>
                <th style={{ width: '80px', textAlign: 'center' }}>
                  {'Detalii'}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Rândul #1: Filtre pe fiecare coloană sub antet */}
              <tr className="magazie-query-row">
                <td className="magazie-query-idx-cell">⌕</td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input ident-input"
                    placeholder={'Filtrează serie...'}
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
                    placeholder={'Model...'}
                    value={filters.product_model}
                    onChange={(e) => setFilters({ ...filters, product_model: e.target.value })}
                  />
                </td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder="TOP/BOT"
                    value={filters.pcb_side}
                    onChange={(e) => setFilters({ ...filters, pcb_side: e.target.value })}
                  />
                </td>
                <td className="magazie-query-cell"></td>
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
                <td className="magazie-query-cell">
                  <select
                    className="magazie-cell-input"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">{'Toate'}</option>
                    <option value="OK">OK</option>
                    <option value="RESCANAT">RESCANAT</option>
                  </select>
                </td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell"></td>
              </tr>

              {/* Rânduri cu plăcile marcate */}
              {filteredMarkings.map((m) => (
                <tr
                  key={m.id || m.qr_serial_number}
                  className={`magazie-data-row ${recentNewIds.has(m.id) ? 'row-cascade-new' : ''}`}
                  onClick={() => setSelectedMarking(m)}
                >
                  <td className="col-idx-cell" style={{ fontWeight: 700, color: '#64748b' }}>
                    #{m.id}
                  </td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 700, color: '#7a0c22' }}>
                    {m.qr_serial_number}
                  </td>
                  <td className="magazie-name-cell">{m.product_model}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: '#f1f5f9',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {m.pcb_side}
                    </span>
                  </td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#475569' }}>
                    {m.marked_at ? new Date(m.marked_at).toLocaleString('ro-RO') : '—'}
                  </td>
                  <td className="magazie-mono-cell">{m.laser_power_pct}%</td>
                  <td className="magazie-mono-cell">{m.mark_duration_ms} ms</td>
                  <td>{m.operator_username || '—'}</td>
                  <td>
                    <span
                      className={`status-badge ${m.status === 'OK' ? 'ok' : 'rescan'}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{m.notes || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="quick-fill-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMarking(m);
                      }}
                    >
                      {'Detalii'}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Rânduri goale pentru umplerea tabelului până jos */}
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
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal 1: Gravare automată (+1) */}
      {isAutoModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsAutoModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {'Gravare laser automată (+1)'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsAutoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '12px 0 20px', lineHeight: 1.6 }}>
              <p style={{ color: '#334155', fontSize: '14px', marginBottom: '14px' }}>
                {'Sistemul calculează automat următorul număr secvențial din 12 cifre pentru ziua de azi:'}
              </p>

              <div
                style={{
                  background: '#fdf2f4',
                  border: '1.5px solid #f2c7ce',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  {'Următoarea serie alocată PCB'}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#fb923c',
                    letterSpacing: '2px',
                  }}
                >
                  {nextSerialInfo?.next_serial || '261029000001'}
                </div>
                <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '6px' }}>
                  Format 12 cifre: [YYMMDD: {nextSerialInfo?.prefix}] + [Nr: #
                  {nextSerialInfo?.sequence}]
                </div>
              </div>

              <div className="magazie-modal-form" style={{ marginTop: '10px' }}>
                <div className="magazie-form-field">
                  <label>{'Model PCB'}</label>
                  <input
                    type="text"
                    value={manualModelForm}
                    onChange={(e) => setManualModelForm(e.target.value)}
                  />
                </div>
                <div className="magazie-form-field">
                  <label>{'Față PCB'}</label>
                  <select
                    value={manualSideForm}
                    onChange={(e) => setManualSideForm(e.target.value as any)}
                  >
                    <option value="TOP">TOP (Componente SMD)</option>
                    <option value="BOTTOM">BOTTOM (Lipituri / Trasee)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setIsAutoModalOpen(false)}
              >
                {'Anulează'}
              </button>
              <button
                type="button"
                className="magazie-btn-submit"
                disabled={submitting}
                onClick={handleAutoMark}
              >
                {submitting
                  ? 'Se gravează...': 'Confirmă și gravează (+1)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Introducere serie manuală (12 cifre strict) */}
      {isManualModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsManualModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {'Introducere serie manuală'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsManualModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualMarkSubmit}>
              <div className="magazie-modal-form">
                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>
                    {'Număr serie exact (12 cifre: YYMMDDxxxxxx)*'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#7a0c22',
                      letterSpacing: '1px',
                    }}
                    placeholder={nextSerialInfo?.next_serial || '261029000001'}
                    value={manualSerialForm}
                    onChange={(e) =>
                      setManualSerialForm(e.target.value.replace(/\D/g, '').slice(0, 12))
                    }
                  />
                  <small style={{ color: '#64748b', fontSize: '11px' }}>
                    {`Exemplu cerut: 260902 pentru 2 septembrie 2026 urmat de 6 cifre incrementabile (lungime: ${manualSerialForm.length}/12).`}
                  </small>
                </div>

                <div className="magazie-form-field">
                  <label>{'Model PCB'}</label>
                  <input
                    type="text"
                    value={manualModelForm}
                    onChange={(e) => setManualModelForm(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{'Față gravare'}</label>
                  <select
                    value={manualSideForm}
                    onChange={(e) => setManualSideForm(e.target.value as any)}
                  >
                    <option value="TOP">TOP</option>
                    <option value="BOTTOM">BOTTOM</option>
                  </select>
                </div>

                <div className="magazie-form-field">
                  <label>{'Putere laser (%)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={manualLaserPower}
                    onChange={(e) => setManualLaserPower(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{'Durată marcare (ms)'}</label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{'Note / observații'}</label>
                  <input
                    type="text"
                    placeholder={
                      'Motiv introducere manuală / lot...'}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  {'Anulează'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || manualSerialForm.length !== 12}
                >
                  {submitting
                    ? 'Se salvează...': 'Înregistrează serie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Rescanare cod QR PCB */}
      {isRescanModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsRescanModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {'Rescanare și verificare cod QR'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => {
                  setIsRescanModalOpen(false);
                  setRescanTraceabilityData(null);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescanSubmit}>
              <div className="magazie-modal-form">
                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{'Cod QR / serie PCB scanată*'}</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={'Scanați codul DataMatrix de pe placă...'}
                    value={rescanSerialInput}
                    onChange={(e) => setRescanSerialInput(e.target.value)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{'Note rescanare'}</label>
                  <input
                    type="text"
                    placeholder={'Observații de verificare...'}
                    value={rescanNotesInput}
                    onChange={(e) => setRescanNotesInput(e.target.value)}
                  />
                </div>
              </div>

              {rescanTraceabilityData && (
                <div
                  style={{
                    marginTop: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>
                    {'Status trasabilitate integrată:'}
                  </strong>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>
                      AOI:{' '}
                      <strong>{rescanTraceabilityData.tests_summary?.aoi?.latest_status || '—'}</strong>
                    </span>
                    <span>
                      ICT:{' '}
                      <strong>{rescanTraceabilityData.tests_summary?.ict?.latest_status || '—'}</strong>
                    </span>
                    <span>
                      EOL:{' '}
                      <strong>{rescanTraceabilityData.tests_summary?.eol?.latest_status || '—'}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => {
                    setIsRescanModalOpen(false);
                    setRescanTraceabilityData(null);
                  }}
                >
                  {'Închide'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || !rescanSerialInput.trim()}
                >
                  {submitting
                    ? 'Se verifică...': 'Rescanează și confirmă'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Detalii marcare laser */}
      {selectedMarking && (
        <div className="magazie-modal-backdrop" onClick={() => setSelectedMarking(null)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {'Detalii marcare laser'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setSelectedMarking(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  background: '#fdf2f4',
                  border: '2px solid #7a0c22',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#7a0c22" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2M9 9h6v6H9V9z" />
                </svg>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>DataMatrix 2D</span>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {'Număr serie unică PCB'}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#7a0c22',
                  }}
                >
                  {selectedMarking.qr_serial_number}
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '4px' }}>
                  {selectedMarking.product_model} — Față: <strong>{selectedMarking.pcb_side}</strong>
                </div>
              </div>
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
                <span style={{ color: '#64748b' }}>{'Data marcării:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedMarking.marked_at
                    ? new Date(selectedMarking.marked_at).toLocaleString('ro-RO')
                    : '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{'Operator:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedMarking.operator_username || '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{'Putere fascicul laser:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedMarking.laser_power_pct}%</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{'Durată impuls:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedMarking.mark_duration_ms} ms</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{'Stare conformitate:'}</span>
                <div>
                  <span
                    className={`status-badge ${
                      selectedMarking.status === 'OK' ? 'ok' : 'rescan'
                    }`}
                  >
                    {selectedMarking.status}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{'Note / observații:'}</span>
                <div style={{ fontWeight: 500, color: '#334155' }}>{selectedMarking.notes || '—'}</div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setSelectedMarking(null)}
              >
                {'Închide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QrLaserPage;
