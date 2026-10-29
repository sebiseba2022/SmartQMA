import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type { Language, User, QrLaserMarkingItem } from '../types';

interface QrLaserPageProps {
  lang: Language;
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

export function QrLaserPage({ lang, currentUser }: QrLaserPageProps) {
  const [markings, setMarkings] = useState<QrLaserMarkingItem[]>([]);
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

  // Încărcare listă marcaje
  const fetchMarkings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/laser/markings');
      if (!res.ok) throw new Error('Eroare la încărcarea marcajelor laser');
      const data = await res.json();
      setMarkings(data.data || []);
      setTotalCount(data.total || (data.data ? data.data.length : 0));
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea marcajelor.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchMarkings();
    fetchNextSerial();
  }, [fetchMarkings, fetchNextSerial]);

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
        lang === 'ro'
          ? `Placa PCB a fost marcată cu succes cu seria ${data.data?.qr_serial_number}.`
          : `PCB marked successfully with serial ${data.data?.qr_serial_number}.`
      );
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
        lang === 'ro'
          ? 'Seria trebuie să conțină exact 12 cifre (format: YYMMDD + 6 cifre secvență).'
          : 'Serial number must contain exactly 12 numeric digits (YYMMDD + 6 sequence digits).'
      );
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
        lang === 'ro'
          ? `Seria manuală ${cleanSerial} a fost înregistrată cu succes.`
          : `Manual serial ${cleanSerial} recorded successfully.`
      );
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
        lang === 'ro'
          ? 'Seria manuală rapidă trebuie să conțină exact 12 cifre numerice.'
          : 'Quick manual serial must contain exactly 12 digits.'
      );
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
        lang === 'ro'
          ? `Seria ${cleanSerial} a fost gravată și adăugată în tabel.`
          : `Serial ${cleanSerial} engraved and listed.`
      );
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
                lang === 'ro'
                  ? `Gravare automată (+1): ${nextSerialInfo?.next_serial || 'Generare serie'}`
                  : `Auto mark (+1): ${nextSerialInfo?.next_serial || 'Generate serial'}`
              }
              onClick={() => setIsAutoModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Gravare (+1)' : 'Auto mark (+1)'}
            </span>
          </div>

          {/* Introducere manuală serie 12 cifre */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Introducere serie manuală' : 'Manual serial input'}
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
              {lang === 'ro' ? 'Serie manuală' : 'Manual serial'}
            </span>
          </div>

          {/* Rescanare / verificare piesă */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Rescanează / verifică PCB' : 'Rescan / inspect PCB'}
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
              {lang === 'ro' ? 'Rescanare QR' : 'Rescan QR'}
            </span>
          </div>

          {/* Reîmprospătează lista */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Reîmprospătează datele' : 'Refresh markings'}
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
              {lang === 'ro' ? 'Reîmprospătare' : 'Refresh'}
            </span>
          </div>

          {/* Export CSV */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Exportă tabelul în CSV' : 'Export CSV'}
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
              {lang === 'ro' ? 'Introducere manuală (12 cifre):' : 'Manual entry (12 digits):'}
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
              {lang === 'ro' ? 'Marchează serie' : 'Mark serial'}
            </button>
          </div>

          <div className="station-quick-group">
            <span className="station-quick-label">
              {lang === 'ro' ? 'Rescanează piesă QR:' : 'Rescan PCB QR:'}
            </span>
            <input
              type="text"
              className="station-quick-input"
              placeholder={lang === 'ro' ? 'Scanează sau tastează cod...' : 'Scan barcode...'}
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
              {lang === 'ro' ? 'Rescanează' : 'Rescan'}
            </button>
          </div>

          {/* Indicatori de stare producție (KPI chips) */}
          <div className="station-kpi-group">
            <div className="station-kpi-chip">
              <span>{lang === 'ro' ? 'Data producției:' : 'Production date:'}</span>
              <strong>{nextSerialInfo?.prefix || '261029'}</strong>
            </div>
            <div className="station-kpi-chip success">
              <span>{lang === 'ro' ? 'Următoarea serie (+1):' : 'Next auto serial:'}</span>
              <strong>{nextSerialInfo?.next_serial || '261029000001'}</strong>
            </div>
            <div className="station-kpi-chip">
              <span>{lang === 'ro' ? 'Total plăci gravate:' : 'Total marked:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Stația de gravare laser DataMatrix 2D — trasabilitate unică PCB'
              : 'DataMatrix 2D laser marking station — unique PCB traceability'}
          </span>
          <span className="magazie-count-badge">
            {lang === 'ro'
              ? `${filteredMarkings.length} din ${totalCount} plăci PCB afișate`
              : `${filteredMarkings.length} of ${totalCount} PCBs displayed`}
          </span>
        </div>

        {/* Tabel profesional pe tot ecranul */}
        <div className="magazie-fulltable-container">
          <table className="magazie-pro-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th style={{ width: '160px' }}>
                  {lang === 'ro' ? 'Număr serie (12 cifre)' : 'Serial number (12 digits)'}
                </th>
                <th style={{ width: '180px' }}>
                  {lang === 'ro' ? 'Model produs' : 'Product model'}
                </th>
                <th style={{ width: '90px' }}>{lang === 'ro' ? 'Față' : 'Side'}</th>
                <th style={{ width: '165px' }}>
                  {lang === 'ro' ? 'Data și ora marcării' : 'Marking timestamp'}
                </th>
                <th style={{ width: '120px' }}>
                  {lang === 'ro' ? 'Putere laser (%)' : 'Laser power (%)'}
                </th>
                <th style={{ width: '110px' }}>
                  {lang === 'ro' ? 'Durată (ms)' : 'Duration (ms)'}
                </th>
                <th style={{ width: '130px' }}>{lang === 'ro' ? 'Operator' : 'Operator'}</th>
                <th style={{ width: '120px' }}>{lang === 'ro' ? 'Status' : 'Status'}</th>
                <th style={{ width: '22%' }}>{lang === 'ro' ? 'Note / detalii' : 'Notes / details'}</th>
                <th style={{ width: '100px', textAlign: 'center' }}>
                  {lang === 'ro' ? 'Detalii' : 'Details'}
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
                    placeholder={lang === 'ro' ? 'Model...' : 'Model...'}
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
                    <option value="">{lang === 'ro' ? 'Toate' : 'All'}</option>
                    <option value="OK">OK</option>
                    <option value="RESCANAT">RESCANAT</option>
                  </select>
                </td>
                <td className="magazie-query-cell"></td>
                <td className="magazie-query-cell"></td>
              </tr>

              {/* Rânduri cu plăcile marcate */}
              {filteredMarkings.map((m, idx) => (
                <tr
                  key={m.id || m.qr_serial_number}
                  className="magazie-data-row"
                  onClick={() => setSelectedMarking(m)}
                >
                  <td className="col-idx-cell">{idx + 1}</td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 700, color: '#ea580c' }}>
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
                      {lang === 'ro' ? 'Detalii' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Rânduri goale pentru umplerea tabelului până jos */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`blank-${i}`} className="magazie-blank-row">
                  <td className="col-idx-cell">{filteredMarkings.length + i + 1}</td>
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
                {lang === 'ro' ? 'Gravare laser automată (+1)' : 'Auto laser marking (+1)'}
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
                {lang === 'ro'
                  ? 'Sistemul calculează automat următorul număr secvențial din 12 cifre pentru ziua de azi:'
                  : 'The system automatically increments the 12-digit serial for today:'}
              </p>

              <div
                style={{
                  background: '#181512',
                  border: '1.5px solid #ea580c',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  {lang === 'ro' ? 'Următoarea serie alocată PCB' : 'Next allocated PCB serial'}
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
                  <label>{lang === 'ro' ? 'Model PCB' : 'PCB Model'}</label>
                  <input
                    type="text"
                    value={manualModelForm}
                    onChange={(e) => setManualModelForm(e.target.value)}
                  />
                </div>
                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Față PCB' : 'PCB Side'}</label>
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
                {lang === 'ro' ? 'Anulează' : 'Cancel'}
              </button>
              <button
                type="button"
                className="magazie-btn-submit"
                disabled={submitting}
                onClick={handleAutoMark}
              >
                {submitting
                  ? lang === 'ro'
                    ? 'Se gravează...'
                    : 'Marking...'
                  : lang === 'ro'
                  ? 'Confirmă și gravează (+1)'
                  : 'Confirm and mark (+1)'}
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
                {lang === 'ro' ? 'Introducere serie manuală' : 'Manual serial entry'}
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
                    {lang === 'ro'
                      ? 'Număr serie exact (12 cifre: YYMMDDxxxxxx)*'
                      : 'Exact serial number (12 digits: YYMMDDxxxxxx)*'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#ea580c',
                      letterSpacing: '1px',
                    }}
                    placeholder={nextSerialInfo?.next_serial || '261029000001'}
                    value={manualSerialForm}
                    onChange={(e) =>
                      setManualSerialForm(e.target.value.replace(/\D/g, '').slice(0, 12))
                    }
                  />
                  <small style={{ color: '#64748b', fontSize: '11px' }}>
                    {lang === 'ro'
                      ? `Exemplu cerut: 260902 pentru 2 septembrie 2026 urmat de 6 cifre incrementabile (lungime: ${manualSerialForm.length}/12).`
                      : `Strict 12 digits required (${manualSerialForm.length}/12).`}
                  </small>
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Model PCB' : 'PCB Model'}</label>
                  <input
                    type="text"
                    value={manualModelForm}
                    onChange={(e) => setManualModelForm(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Față gravare' : 'Marking side'}</label>
                  <select
                    value={manualSideForm}
                    onChange={(e) => setManualSideForm(e.target.value as any)}
                  >
                    <option value="TOP">TOP</option>
                    <option value="BOTTOM">BOTTOM</option>
                  </select>
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Putere laser (%)' : 'Laser power (%)'}</label>
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
                  <label>{lang === 'ro' ? 'Durată marcare (ms)' : 'Duration (ms)'}</label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                  />
                </div>

                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{lang === 'ro' ? 'Note / observații' : 'Notes / comments'}</label>
                  <input
                    type="text"
                    placeholder={
                      lang === 'ro'
                        ? 'Motiv introducere manuală / lot...'
                        : 'Reason for manual entry...'
                    }
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
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || manualSerialForm.length !== 12}
                >
                  {submitting
                    ? lang === 'ro'
                      ? 'Se salvează...'
                      : 'Saving...'
                    : lang === 'ro'
                    ? 'Înregistrează serie'
                    : 'Save serial'}
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
                {lang === 'ro' ? 'Rescanare și verificare cod QR' : 'Rescan and inspect QR code'}
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
                  <label>{lang === 'ro' ? 'Cod QR / serie PCB scanată*' : 'Scanned QR / serial*'}</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={lang === 'ro' ? 'Scanați codul DataMatrix de pe placă...' : 'Scan code...'}
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
                  <label>{lang === 'ro' ? 'Note rescanare' : 'Rescan notes'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ro' ? 'Observații de verificare...' : 'Inspection notes...'}
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
                    {lang === 'ro' ? 'Status trasabilitate integrată:' : 'Traceability summary:'}
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
                  {lang === 'ro' ? 'Închide' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || !rescanSerialInput.trim()}
                >
                  {submitting
                    ? lang === 'ro'
                      ? 'Se verifică...'
                      : 'Checking...'
                    : lang === 'ro'
                    ? 'Rescanează și confirmă'
                    : 'Rescan and confirm'}
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
                {lang === 'ro' ? 'Detalii marcare laser' : 'Laser marking details'}
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
                  background: '#181512',
                  border: '2px solid #ea580c',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ea580c" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2M9 9h6v6H9V9z" />
                </svg>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>DataMatrix 2D</span>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {lang === 'ro' ? 'Număr serie unică PCB' : 'Unique PCB serial'}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#ea580c',
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
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Data marcării:' : 'Marked at:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedMarking.marked_at
                    ? new Date(selectedMarking.marked_at).toLocaleString('ro-RO')
                    : '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Operator:' : 'Operator:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedMarking.operator_username || '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Putere fascicul laser:' : 'Laser power:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedMarking.laser_power_pct}%</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Durată impuls:' : 'Pulse duration:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedMarking.mark_duration_ms} ms</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Stare conformitate:' : 'Status:'}</span>
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
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Note / observații:' : 'Notes:'}</span>
                <div style={{ fontWeight: 500, color: '#334155' }}>{selectedMarking.notes || '—'}</div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setSelectedMarking(null)}
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

export default QrLaserPage;
