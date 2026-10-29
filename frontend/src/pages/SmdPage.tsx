import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type {
  Language,
  User,
  SmdPlacementItem,
  StationFeederItem,
  WarehouseOrder,
} from '../types';

interface SmdPageProps {
  lang: Language;
  currentUser?: User | null;
}

interface SmdFilters {
  qr_serial_number: string;
  bestuck_position: string;
  ident: string;
  part_name: string;
  operator_username: string;
}

const EMPTY_FILTERS: SmdFilters = {
  qr_serial_number: '',
  bestuck_position: '',
  ident: '',
  part_name: '',
  operator_username: '',
};

const MIN_EMPTY_TABLE_ROWS = 22;

export function SmdPage({ lang, currentUser }: SmdPageProps) {
  const [placements, setPlacements] = useState<SmdPlacementItem[]>([]);
  const [feeders, setFeeders] = useState<StationFeederItem[]>([]);
  const [inventoryList, setInventoryList] = useState<WarehouseOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filtre pe coloane
  const [filters, setFilters] = useState<SmdFilters>(EMPTY_FILTERS);

  // Bară rapidă amplasare
  const [quickPcbSerial, setQuickPcbSerial] = useState<string>('');
  const [quickFeederPosition, setQuickFeederPosition] = useState<string>('U3');

  // Modale
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isFeederModalOpen, setIsFeederModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<SmdPlacementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulare
  const [placePcbSerial, setPlacePcbSerial] = useState('');
  const [placePosition, setPlacePosition] = useState('U3');
  const [placeComponentId, setPlaceComponentId] = useState<number>(10003);

  const [feederSlot, setFeederSlot] = useState('U3');
  const [feederComponentId, setFeederComponentId] = useState<number>(10003);

  // Preluare amplasări SMD
  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/placements/smd');
      if (!res.ok) throw new Error('Eroare la încărcarea amplasărilor SMD');
      const data = await res.json();
      setPlacements(data.data || []);
      setTotalCount(data.total || (data.data ? data.data.length : 0));
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea amplasărilor SMD.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Preluare alimentatoare configurate pe linia SMD
  const fetchFeeders = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/feeders/WS-SMD-04');
      if (!res.ok) return;
      const data = await res.json();
      setFeeders(data.feeders || []);
    } catch {
      // eroare ignorată pe fundal
    }
  }, []);

  // Preluare componente disponibile din magazie
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/inventory?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      setInventoryList(data.data || []);
    } catch {
      // eroare ignorată
    }
  }, []);

  useEffect(() => {
    fetchPlacements();
    fetchFeeders();
    fetchInventory();
  }, [fetchPlacements, fetchFeeders, fetchInventory]);

  // Salvare amplasare nouă
  const handlePlaceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSerial = placePcbSerial.trim();
    if (!cleanSerial) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/placements/smd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-SMD-04',
          qr_serial_number: cleanSerial,
          bestuck_position: placePosition,
          component_internal_id: Number(placeComponentId),
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la amplasare.');

      setNotice(
        lang === 'ro'
          ? `Amplasarea componentei pe poziția ${placePosition} pentru PCB-ul ${cleanSerial} a fost înregistrată.`
          : `Component placement on ${placePosition} for PCB ${cleanSerial} recorded.`
      );
      setIsPlaceModalOpen(false);
      setPlacePcbSerial('');
      fetchPlacements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Montare rapidă din bara de sus
  const handleQuickPlaceSubmit = async () => {
    const cleanSerial = quickPcbSerial.trim();
    if (!cleanSerial) return;

    // Căutăm componenta alocată pe feederul selectat
    const feeder = feeders.find((f) => f.position === quickFeederPosition);
    const compId = feeder ? feeder.component_internal_id : 10003;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/placements/smd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-SMD-04',
          qr_serial_number: cleanSerial,
          bestuck_position: quickFeederPosition,
          component_internal_id: compId,
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la amplasare.');

      setNotice(
        lang === 'ro'
          ? `Amplasat ${quickFeederPosition} pe PCB ${cleanSerial}.`
          : `Placed ${quickFeederPosition} on PCB ${cleanSerial}.`
      );
      fetchPlacements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Salvare încărcare rolă pe alimentator (feeder)
  const handleFeederSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/feeders/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-SMD-04',
          position: feederSlot,
          component_internal_id: Number(feederComponentId),
          loaded_by: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la încărcarea rolei.');

      setNotice(
        lang === 'ro'
          ? `Rola din depozit a fost asociată slotului de alimentare ${feederSlot}.`
          : `Reel associated with feeder slot ${feederSlot}.`
      );
      setIsFeederModalOpen(false);
      fetchFeeders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrare tabel
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      if (
        filters.qr_serial_number &&
        !p.qr_serial_number.toLowerCase().includes(filters.qr_serial_number.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.bestuck_position &&
        !p.bestuck_position.toLowerCase().includes(filters.bestuck_position.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.ident &&
        !String(p.component_internal_id).includes(filters.ident) &&
        !(p.component?.ident || '').includes(filters.ident)
      ) {
        return false;
      }
      if (
        filters.part_name &&
        !(p.component?.part_name || '').toLowerCase().includes(filters.part_name.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.operator_username &&
        !(p.operator_username || '').toLowerCase().includes(filters.operator_username.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [placements, filters]);

  const emptyRowsCount = Math.max(0, MIN_EMPTY_TABLE_ROWS - filteredPlacements.length);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Nr_Crt',
      'Serie_PCB',
      'Pozitie_Bestuck',
      'Ident_Componenta',
      'Denumire_Piesa',
      'Lot_Furnizor',
      'Furnizor',
      'Operator',
      'Data_Montaj',
    ];
    const rows = filteredPlacements.map((p, idx) => [
      idx + 1,
      p.qr_serial_number,
      p.bestuck_position,
      p.component_internal_id,
      `"${(p.component?.part_name || '').replace(/"/g, '""')}"`,
      p.component?.supplier_lot || '',
      `"${(p.component?.provider || '').replace(/"/g, '""')}"`,
      p.operator_username || '',
      p.mounted_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplasari_smd_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga */}
      <aside className="magazie-left-rail" aria-label="Acțiuni SMD">
        <div className="magazie-rail-group">
          {/* Încarcă rolă / feeder */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              title={lang === 'ro' ? 'Încarcă rolă pe alimentator (Feeder)' : 'Load reel onto feeder'}
              onClick={() => setIsFeederModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Încarcă rolă' : 'Load reel'}
            </span>
          </div>

          {/* Înregistrează amplasare SMD */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Înregistrează amplasare SMD' : 'Record SMD placement'}
              onClick={() => setIsPlaceModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Amplasare' : 'Placement'}
            </span>
          </div>

          {/* Reîmprospătează lista */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Reîmprospătează lista' : 'Refresh list'}
              onClick={() => {
                fetchPlacements();
                fetchFeeders();
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

        {/* Bară rapidă de operare linie pick-and-place */}
        <section className="station-quick-bar" aria-label="Operare rapidă SMD">
          <div className="station-quick-group">
            <span className="station-quick-label">
              {lang === 'ro' ? 'Scanare serie PCB:' : 'Scan PCB serial:'}
            </span>
            <input
              type="text"
              className="station-quick-input"
              placeholder="ex: 261029000001"
              value={quickPcbSerial}
              onChange={(e) => setQuickPcbSerial(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickPlaceSubmit();
              }}
            />
            <span className="station-quick-label">{lang === 'ro' ? 'Slot Feeder:' : 'Feeder slot:'}</span>
            <select
              className="station-quick-input"
              style={{ minWidth: '100px' }}
              value={quickFeederPosition}
              onChange={(e) => setQuickFeederPosition(e.target.value)}
            >
              {feeders.length > 0 ? (
                feeders.map((f) => (
                  <option key={f.position} value={f.position}>
                    {f.position} ({f.component?.part_name?.slice(0, 18) || `#${f.component_internal_id}`})
                  </option>
                ))
              ) : (
                <>
                  <option value="U3">U3 (ATmega16U2)</option>
                  <option value="U5">U5 (NCP1117)</option>
                  <option value="U2">U2 (LP2985)</option>
                  <option value="U4">U4 (LMV358)</option>
                  <option value="T1">T1 (FDN340P)</option>
                  <option value="F1">F1 (MF-MSMF050)</option>
                  <option value="Y1">Y1 (CSTCE16M)</option>
                </>
              )}
            </select>
            <button
              type="button"
              className="station-quick-btn"
              disabled={submitting || !quickPcbSerial.trim()}
              onClick={handleQuickPlaceSubmit}
            >
              {lang === 'ro' ? 'Amplasează piesă' : 'Place part'}
            </button>
          </div>

          <div className="station-kpi-group">
            <div className="station-kpi-chip">
              <span>{lang === 'ro' ? 'Alimentatoare active:' : 'Active feeders:'}</span>
              <strong>{feeders.length}</strong>
            </div>
            <div className="station-kpi-chip success">
              <span>{lang === 'ro' ? 'Total montate:' : 'Total placements:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Zona de amplasare SMD — Linie Pick & Place automată & Alimentatoare role'
              : 'SMD Placement Area — Automated Pick & Place Line & Feeder Racks'}
          </span>
          <span className="magazie-count-badge">
            {lang === 'ro'
              ? `${filteredPlacements.length} din ${totalCount} amplasări afișate`
              : `${filteredPlacements.length} of ${totalCount} placements displayed`}
          </span>
        </div>

        {/* Tabel complet */}
        <div className="magazie-fulltable-container">
          <table className="magazie-pro-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th style={{ width: '160px' }}>{lang === 'ro' ? 'Serie PCB' : 'PCB Serial'}</th>
                <th style={{ width: '120px' }}>{lang === 'ro' ? 'Poziție Bestück' : 'Position'}</th>
                <th style={{ width: '110px' }}>{lang === 'ro' ? 'Ident' : 'Ident'}</th>
                <th style={{ width: '26%' }}>
                  {lang === 'ro' ? 'Denumire componentă' : 'Component name'}
                </th>
                <th style={{ width: '160px' }}>{lang === 'ro' ? 'Lot furnizor' : 'Supplier lot'}</th>
                <th style={{ width: '18%' }}>{lang === 'ro' ? 'Furnizor' : 'Provider'}</th>
                <th style={{ width: '130px' }}>{lang === 'ro' ? 'Operator' : 'Operator'}</th>
                <th style={{ width: '165px' }}>{lang === 'ro' ? 'Data montajului' : 'Mounted at'}</th>
                <th style={{ width: '100px', textAlign: 'center' }}>
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
                    placeholder="U1, R1..."
                    value={filters.bestuck_position}
                    onChange={(e) =>
                      setFilters({ ...filters, bestuck_position: e.target.value })
                    }
                  />
                </td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input ident-input"
                    placeholder="10003..."
                    value={filters.ident}
                    onChange={(e) => setFilters({ ...filters, ident: e.target.value })}
                  />
                </td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder={lang === 'ro' ? 'Denumire piese...' : 'Part name...'}
                    value={filters.part_name}
                    onChange={(e) => setFilters({ ...filters, part_name: e.target.value })}
                  />
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

              {filteredPlacements.map((p, idx) => (
                <tr
                  key={p.id || `${p.qr_serial_number}-${p.bestuck_position}`}
                  className="magazie-data-row"
                  onClick={() => setSelectedPlacement(p)}
                >
                  <td className="col-idx-cell">{idx + 1}</td>
                  <td className="magazie-mono-cell" style={{ fontWeight: 700, color: '#ea580c' }}>
                    {p.qr_serial_number}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {p.bestuck_position}
                    </span>
                  </td>
                  <td className="magazie-ident-cell">
                    {p.component?.ident || p.component_internal_id}
                  </td>
                  <td className="magazie-name-cell">
                    {p.component?.part_name || `Componentă #${p.component_internal_id}`}
                  </td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#475569' }}>
                    {p.component?.supplier_lot || '—'}
                  </td>
                  <td style={{ color: '#334155' }}>{p.component?.provider || '—'}</td>
                  <td>{p.operator_username || '—'}</td>
                  <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#64748b' }}>
                    {p.mounted_at ? new Date(p.mounted_at).toLocaleString('ro-RO') : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="quick-fill-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlacement(p);
                      }}
                    >
                      {lang === 'ro' ? 'Detalii' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}

              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`blank-${i}`} className="magazie-blank-row">
                  <td className="col-idx-cell">{filteredPlacements.length + i + 1}</td>
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

      {/* Modal: Încarcă rolă pe feeder */}
      {isFeederModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsFeederModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Configurare alimentator (Feeder)' : 'Configure feeder reel'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsFeederModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeederSubmit}>
              <div className="magazie-modal-form">
                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Slot alimentator / poziție*' : 'Feeder position*'}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: U3, U5, R1"
                    value={feederSlot}
                    onChange={(e) => setFeederSlot(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Rolă din depozit (Ident)*' : 'Warehouse reel (Ident)*'}</label>
                  <select
                    value={feederComponentId}
                    onChange={(e) => setFeederComponentId(Number(e.target.value))}
                  >
                    {inventoryList.map((item) => (
                      <option key={item.internal_id} value={item.internal_id}>
                        {item.ident} — {item.part_name} ({item.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsFeederModalOpen(false)}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || !feederSlot.trim()}
                >
                  {submitting
                    ? lang === 'ro'
                      ? 'Se asociază...'
                      : 'Saving...'
                    : lang === 'ro'
                    ? 'Asociază rola pe feeder'
                    : 'Bind reel to feeder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Amplasare nouă SMD */}
      {isPlaceModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsPlaceModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Înregistrare amplasare SMD' : 'Record SMD placement'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsPlaceModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceSubmit}>
              <div className="magazie-modal-form">
                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label>{lang === 'ro' ? 'Serie placă PCB (12 cifre)*' : 'PCB serial (12 digits)*'}</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="ex: 261029000001"
                    value={placePcbSerial}
                    onChange={(e) => setPlacePcbSerial(e.target.value)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Poziție Bestück*' : 'Bestück position*'}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: U3, C1, R1"
                    value={placePosition}
                    onChange={(e) => setPlacePosition(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Componentă (Ident)*' : 'Component (Ident)*'}</label>
                  <select
                    value={placeComponentId}
                    onChange={(e) => setPlaceComponentId(Number(e.target.value))}
                  >
                    {inventoryList.map((item) => (
                      <option key={item.internal_id} value={item.internal_id}>
                        {item.ident} — {item.part_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsPlaceModalOpen(false)}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="magazie-btn-submit"
                  disabled={submitting || !placePcbSerial.trim()}
                >
                  {submitting
                    ? lang === 'ro'
                      ? 'Se înregistrează...'
                      : 'Saving...'
                    : lang === 'ro'
                    ? 'Confirmă amplasare'
                    : 'Confirm placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalii amplasare */}
      {selectedPlacement && (
        <div className="magazie-modal-backdrop" onClick={() => setSelectedPlacement(null)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Detalii amplasare SMD' : 'SMD placement details'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setSelectedPlacement(null)}
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
                  {selectedPlacement.qr_serial_number}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Poziție:' : 'Position:'}</span>
                <div style={{ fontWeight: 700 }}>{selectedPlacement.bestuck_position}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Componentă:' : 'Part:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedPlacement.component?.part_name || `ID #${selectedPlacement.component_internal_id}`}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Lot furnizor:' : 'Supplier lot:'}</span>
                <div style={{ fontFamily: 'monospace' }}>
                  {selectedPlacement.component?.supplier_lot || '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Furnizor:' : 'Provider:'}</span>
                <div>{selectedPlacement.component?.provider || '—'}</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Operator linie:' : 'Operator:'}</span>
                <div>{selectedPlacement.operator_username || '—'}</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Data amplasării:' : 'Mounted at:'}</span>
                <div>
                  {selectedPlacement.mounted_at
                    ? new Date(selectedPlacement.mounted_at).toLocaleString('ro-RO')
                    : '—'}
                </div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setSelectedPlacement(null)}
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

export default SmdPage;
