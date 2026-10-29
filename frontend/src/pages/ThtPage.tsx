import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from 'react';
import type {
  Language,
  User,
  ThtPlacementItem,
  WarehouseOrder,
} from '../types';
import { useRealtimeLiveFeed } from '../utils/useRealtimeLiveFeed';
import { LiveStreamFreezeBanner } from '../components/LiveStreamFreezeBanner';
import { SearchIcon } from '../components/icons/IndustrialIcons';

interface ThtPageProps {
  lang: Language;
  currentUser?: User | null;
}

interface ThtFilters {
  qr_serial_number: string;
  bestuck_position: string;
  ident: string;
  part_name: string;
  operator_username: string;
}

const EMPTY_FILTERS: ThtFilters = {
  qr_serial_number: '',
  bestuck_position: '',
  ident: '',
  part_name: '',
  operator_username: '',
};

const MIN_EMPTY_TABLE_ROWS = 22;

export function ThtPage({ lang, currentUser }: ThtPageProps) {
  const [inventoryList, setInventoryList] = useState<WarehouseOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Set de plăci expandate pentru afișarea sublistei de componente THT
  const [expandedSerials, setExpandedSerials] = useState<Set<string>>(new Set());

  const toggleExpandSerial = (serial: string) => {
    setExpandedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
  };

  // Funcție de preluare date pentru hook-ul de flux live
  const fetchPlacementsCallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/placements/tht?limit=50');
      if (!res.ok) throw new Error('Eroare la încărcarea amplasărilor THT');
      const data = await res.json();
      setTotalCount(data.total || (data.data ? data.data.length : 0));
      return data.data || [];
    } catch (err: any) {
      setError(err.message || 'Eroare de rețea la preluarea amplasărilor THT.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook flux realtime cu înghețare la derulare
  const {
    items: placements,
    pendingNewCount,
    recentNewIds,
    containerRef,
    handleScroll,
    resumeLiveStream,
    refreshNow: fetchPlacements,
  } = useRealtimeLiveFeed<ThtPlacementItem>({
    fetchFn: fetchPlacementsCallback,
    intervalMs: 2500,
  });

  // Filtre pe coloane
  const [filters, setFilters] = useState<ThtFilters>(EMPTY_FILTERS);

  // Bară rapidă
  const [quickPcbSerial, setQuickPcbSerial] = useState<string>('');
  const [quickPosition, setQuickPosition] = useState<string>('U1');

  // Modale
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<ThtPlacementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formular inserție nouă
  const [formSerial, setFormSerial] = useState('');
  const [formPosition, setFormPosition] = useState('U1');
  const [formComponentId, setFormComponentId] = useState<number>(10002);

  // Parametri proces lipire selectivă
  const [bathTemp] = useState('260°C');
  const [solderAlloy] = useState('SAC305 (Sn96.5 Ag3.0 Cu0.5)');
  const [fluxType] = useState('No-Clean VOC-Free (Alcohol Based)');
  const [waveHeight] = useState('8.5 mm');

  // Preluare componente disponibile
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
    fetchInventory();
  }, [fetchInventory]);

  // Salvare inserție THT nouă
  const handleInsertSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSerial = formSerial.trim();
    if (!cleanSerial) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/placements/tht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-THT-06',
          qr_serial_number: cleanSerial,
          bestuck_position: formPosition,
          component_internal_id: Number(formComponentId),
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la salvare.');

      setNotice(
        lang === 'ro'
          ? `Componenta THT ${formPosition} montată pe PCB ${cleanSerial}.`
          : `THT component ${formPosition} mounted on PCB ${cleanSerial}.`
      );
      setIsInsertModalOpen(false);
      setFormSerial('');
      fetchPlacements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Inserție rapidă
  const handleQuickInsert = async () => {
    const cleanSerial = quickPcbSerial.trim();
    if (!cleanSerial) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/placements/tht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: 'WS-THT-06',
          qr_serial_number: cleanSerial,
          bestuck_position: quickPosition,
          component_internal_id: 10002,
          operator_username: currentUser?.username || 'operator',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la inserție.');

      setNotice(
        lang === 'ro'
          ? `Inserție THT confirmată pentru ${quickPosition} pe PCB ${cleanSerial}.`
          : `THT insertion confirmed for ${quickPosition} on PCB ${cleanSerial}.`
      );
      setQuickPcbSerial('');
      fetchPlacements();
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

  // Grupăm componentele THT pe baza seriei PCB unice de 12 cifre
  const groupedBoards = useMemo(() => {
    const map = new Map<
      string,
      {
        id: number | string;
        qr_serial_number: string;
        items: ThtPlacementItem[];
        positions: string[];
        operator_username?: string | null;
        mounted_at: string | null;
        sampleComponent: any;
      }
    >();

    for (const p of filteredPlacements) {
      const serial = p.qr_serial_number;
      if (!map.has(serial)) {
        map.set(serial, {
          id: p.id,
          qr_serial_number: serial,
          items: [],
          positions: [],
          operator_username: p.operator_username,
          mounted_at: p.mounted_at,
          sampleComponent: p.component,
        });
      }
      const g = map.get(serial)!;
      g.items.push(p);
      if (!g.positions.includes(p.bestuck_position)) {
        g.positions.push(p.bestuck_position);
      }
    }
    return Array.from(map.values());
  }, [filteredPlacements]);

  const emptyRowsCount = Math.max(0, MIN_EMPTY_TABLE_ROWS - groupedBoards.length);

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
    link.setAttribute('download', `amplasari_tht_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga */}
      <aside className="magazie-left-rail" aria-label="Acțiuni THT">
        <div className="magazie-rail-group">
          {/* Înregistrează inserție THT */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              title={lang === 'ro' ? 'Înregistrează inserție THT' : 'Record THT placement'}
              onClick={() => setIsInsertModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Inserție THT' : 'Insert THT'}
            </span>
          </div>

          {/* Parametri baie cositor */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Parametri lipire selectivă' : 'Soldering parameters'}
              onClick={() => setIsParamsModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Parametri cuvă' : 'Solder params'}
            </span>
          </div>

          {/* Reîmprospătează lista */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              title={lang === 'ro' ? 'Reîmprospătează lista' : 'Refresh list'}
              onClick={fetchPlacements}
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

        {/* Bară rapidă */}
        <section className="station-quick-bar" aria-label="Operare rapidă THT">
          <div className="station-quick-group">
            <span className="station-quick-label">
              {lang === 'ro' ? 'Serie PCB:' : 'PCB serial:'}
            </span>
            <input
              type="text"
              className="station-quick-input"
              placeholder="ex: 261029000001"
              value={quickPcbSerial}
              onChange={(e) => setQuickPcbSerial(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickInsert();
              }}
            />
            <span className="station-quick-label">{lang === 'ro' ? 'Poziție:' : 'Position:'}</span>
            <select
              className="station-quick-input"
              style={{ minWidth: '100px' }}
              value={quickPosition}
              onChange={(e) => setQuickPosition(e.target.value)}
            >
              <option value="U1">U1 (ATmega328P DIP-28)</option>
              <option value="J1">J1 (Header 8-pin)</option>
              <option value="J2">J2 (Header 10-pin)</option>
              <option value="DC1">DC1 (Jack alimentare 2.1mm)</option>
              <option value="SW1">SW1 (Buton reset tactile)</option>
            </select>
            <button
              type="button"
              className="station-quick-btn"
              disabled={submitting || !quickPcbSerial.trim()}
              onClick={handleQuickInsert}
            >
              {lang === 'ro' ? 'Montează componentă THT' : 'Mount THT component'}
            </button>
          </div>

          <div className="station-kpi-group">
            <div className="station-kpi-chip">
              <span>{lang === 'ro' ? 'Temp. cositor:' : 'Bath temp:'}</span>
              <strong style={{ color: '#fb923c' }}>{bathTemp}</strong>
            </div>
            <div className="station-kpi-chip success">
              <span>{lang === 'ro' ? 'Total inserții THT:' : 'Total THT:'}</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar informativ */}
        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Zona de amplasare THT — Inserție componente Through-Hole & Lipire selectivă'
              : 'THT Placement Area — Through-Hole Component Insertion & Selective Wave Soldering'}
          </span>
          <span className="magazie-count-badge">
            {lang === 'ro'
              ? `${groupedBoards.length} plăci PCB (${filteredPlacements.length} componente THT) din ${totalCount} înregistrate`
              : `${groupedBoards.length} PCBs (${filteredPlacements.length} THT components) of ${totalCount} recorded`}
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
                <th style={{ width: '105px' }}>{lang === 'ro' ? 'Poziții Bestück' : 'Positions'}</th>
                <th style={{ width: '75px' }}>{lang === 'ro' ? 'Ident' : 'Ident'}</th>
                <th style={{ minWidth: '170px' }}>
                  {lang === 'ro' ? 'Denumire componentă THT' : 'THT component name'}
                </th>
                <th style={{ width: '120px' }}>{lang === 'ro' ? 'Lot furnizor' : 'Supplier lot'}</th>
                <th style={{ width: '130px' }}>{lang === 'ro' ? 'Furnizor' : 'Provider'}</th>
                <th style={{ width: '100px' }}>{lang === 'ro' ? 'Operator' : 'Operator'}</th>
                <th style={{ width: '140px' }}>{lang === 'ro' ? 'Data montajului' : 'Mounted at'}</th>
                <th style={{ width: '85px', textAlign: 'center' }}>
                  {lang === 'ro' ? 'Acțiuni' : 'Actions'}
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
                    placeholder="U1, J1..."
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
                    placeholder="10002..."
                    value={filters.ident}
                    onChange={(e) => setFilters({ ...filters, ident: e.target.value })}
                  />
                </td>
                <td className="magazie-query-cell">
                  <input
                    type="text"
                    className="magazie-cell-input"
                    placeholder={lang === 'ro' ? 'Denumire piesă...' : 'Part name...'}
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

              {/* Rânduri grupate pe PCB cu acordion pentru componente */}
              {groupedBoards.map((board) => {
                const isExpanded = expandedSerials.has(board.qr_serial_number);
                const isNew = board.items.some((it) => recentNewIds.has(it.id));
                return (
                  <React.Fragment key={board.qr_serial_number}>
                    <tr
                      className={`magazie-data-row ${isNew ? 'row-cascade-new' : ''}`}
                      onClick={() => toggleExpandSerial(board.qr_serial_number)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="col-idx-cell" style={{ fontWeight: 700, color: '#64748b' }}>
                        #{board.id}
                      </td>
                      <td className="magazie-mono-cell" style={{ fontWeight: 700, color: '#ea580c' }}>
                        <button
                          type="button"
                          className={`accordion-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandSerial(board.qr_serial_number);
                          }}
                          title={isExpanded ? 'Restrânge componente THT' : 'Deschide componente THT'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <span>{board.qr_serial_number}</span>
                        {board.items.length > 1 && (
                          <span className="smd-count-pill">
                            {board.items.length} {lang === 'ro' ? 'piese' : 'parts'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {board.positions.map((pos) => (
                            <span key={pos} className="badge-position">
                              {pos}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="magazie-ident-cell">
                        {board.items.length === 1
                          ? (board.items[0].component?.ident || board.items[0].component_internal_id)
                          : `Set (${board.items.length})`}
                      </td>
                      <td className="magazie-name-cell">
                        {board.items.length === 1
                          ? (board.items[0].component?.part_name || `Componentă #${board.items[0].component_internal_id}`)
                          : (lang === 'ro'
                              ? `Set complet ${board.items.length} componente THT montate`
                              : `Complete set of ${board.items.length} mounted THT parts`)}
                      </td>
                      <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#475569' }}>
                        {board.sampleComponent?.supplier_lot || '—'}
                      </td>
                      <td style={{ color: '#334155' }}>{board.sampleComponent?.provider || '—'}</td>
                      <td>{board.operator_username || '—'}</td>
                      <td className="magazie-mono-cell" style={{ fontSize: '12px', color: '#64748b' }}>
                        {board.mounted_at ? new Date(board.mounted_at).toLocaleString('ro-RO') : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="quick-fill-pill"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (board.items.length > 1) {
                              toggleExpandSerial(board.qr_serial_number);
                            } else {
                              setSelectedPlacement(board.items[0]);
                            }
                          }}
                        >
                          {board.items.length > 1
                            ? (isExpanded ? (lang === 'ro' ? 'Închide' : 'Close') : (lang === 'ro' ? 'Componente' : 'Parts'))
                            : (lang === 'ro' ? 'Detalii' : 'Details')}
                        </button>
                      </td>
                    </tr>

                    {/* Sublistă acordion cu componentele THT montate pe acest PCB */}
                    {isExpanded && (
                      <tr key={`sub-${board.qr_serial_number}`} className="smd-subrow">
                        <td colSpan={10}>
                          <div className="smd-subtable-container">
                            <div className="smd-subtable-header">
                              <span>
                                <SearchIcon size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                {lang === 'ro'
                                  ? `Componente THT montate pe PCB ${board.qr_serial_number} (${board.items.length} poziții):`
                                  : `THT components mounted on PCB ${board.qr_serial_number} (${board.items.length} positions):`}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {lang === 'ro' ? 'Fiecare piesă THT este înregistrată individual în baza de date' : 'Each THT part is individually tracked in DB'}
                              </span>
                            </div>
                            <table className="smd-nested-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '80px' }}>{lang === 'ro' ? 'Poziție' : 'Position'}</th>
                                  <th style={{ width: '100px' }}>{lang === 'ro' ? 'Ident' : 'Ident'}</th>
                                  <th>{lang === 'ro' ? 'Denumire componentă' : 'Component name'}</th>
                                  <th style={{ width: '150px' }}>{lang === 'ro' ? 'Lot furnizor' : 'Supplier lot'}</th>
                                  <th style={{ width: '160px' }}>{lang === 'ro' ? 'Furnizor' : 'Provider'}</th>
                                  <th style={{ width: '160px' }}>{lang === 'ro' ? 'Data montajului' : 'Mounted at'}</th>
                                  <th style={{ width: '90px', textAlign: 'center' }}>{lang === 'ro' ? 'Fișă' : 'Doc'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {board.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPlacement(item);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <td>
                                      <span className="badge-position">{item.bestuck_position}</span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                      {item.component?.ident || item.component_internal_id}
                                    </td>
                                    <td>{item.component?.part_name || `Componentă #${item.component_internal_id}`}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                      {item.component?.supplier_lot || '—'}
                                    </td>
                                    <td>{item.component?.provider || '—'}</td>
                                    <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                                      {item.mounted_at ? new Date(item.mounted_at).toLocaleString('ro-RO') : '—'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        className="quick-fill-pill"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPlacement(item);
                                        }}
                                      >
                                        Info
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

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

      {/* Modal: Înregistrare inserție THT */}
      {isInsertModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsInsertModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Înregistrare inserție Through-Hole' : 'Record THT insertion'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsInsertModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInsertSubmit}>
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
                  <label>{lang === 'ro' ? 'Poziție Bestück THT*' : 'THT position*'}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: U1, J1, DC1"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="magazie-form-field">
                  <label>{lang === 'ro' ? 'Componentă (Ident)*' : 'Component (Ident)*'}</label>
                  <select
                    value={formComponentId}
                    onChange={(e) => setFormComponentId(Number(e.target.value))}
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
                  onClick={() => setIsInsertModalOpen(false)}
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
                      ? 'Se înregistrează...'
                      : 'Saving...'
                    : lang === 'ro'
                    ? 'Confirmă inserție THT'
                    : 'Confirm THT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Parametri cuvă lipire selectivă */}
      {isParamsModalOpen && (
        <div className="magazie-modal-backdrop" onClick={() => setIsParamsModalOpen(false)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Parametri cuvă lipire selectivă & val' : 'Soldering bath parameters'}
              </h3>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsParamsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Temperatură cuvă:' : 'Bath temperature:'}</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>{bathTemp}</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Înălțime val:' : 'Wave height:'}</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{waveHeight}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Aliaj cositor ecologic:' : 'Solder alloy:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{solderAlloy}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Tip fluxant aplicat:' : 'Flux type:'}</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{fluxType}</div>
              </div>
            </div>

            <div className="magazie-modal-actions">
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={() => setIsParamsModalOpen(false)}
              >
                {lang === 'ro' ? 'Închide' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalii amplasare */}
      {selectedPlacement && (
        <div className="magazie-modal-backdrop" onClick={() => setSelectedPlacement(null)}>
          <div className="magazie-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="magazie-modal-header">
              <h3 className="magazie-modal-title">
                {lang === 'ro' ? 'Detalii componentă THT' : 'THT component details'}
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
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Operator:' : 'Operator:'}</span>
                <div>{selectedPlacement.operator_username || '—'}</div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>{lang === 'ro' ? 'Data montajului:' : 'Mounted at:'}</span>
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

export default ThtPage;
