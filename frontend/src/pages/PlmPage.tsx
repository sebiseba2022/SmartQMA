import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type UIEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { Language, ComponentIdentItem } from '../types';
import { getCurrentDateInput } from '../utils/date';

const MIN_EMPTY_TABLE_ROWS = 24;

export interface PlmColumnFilters {
  ident: string;
  part_name: string;
  manufacturer_part_number: string;
  provider: string;
  package_type: string;
  manufacturer: string;
  unit: string;
}

export const EMPTY_PLM_FILTERS: PlmColumnFilters = {
  ident: '',
  part_name: '',
  manufacturer_part_number: '',
  provider: '',
  package_type: '',
  manufacturer: '',
  unit: '',
};

interface PlmPageProps {
  lang: Language;
}

export function PlmPage({ lang }: PlmPageProps) {
  const [idents, setIdents] = useState<ComponentIdentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isAllActive, setIsAllActive] = useState<boolean>(false);
  const [tableNotice, setTableNotice] = useState<string | null>(null);

  // Filtre pe coloane
  const [draftFilters, setDraftFilters] = useState<PlmColumnFilters>(EMPTY_PLM_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PlmColumnFilters>(EMPTY_PLM_FILTERS);

  // Modal vizualizare PDF datasheet
  const [activeDatasheetIdent, setActiveDatasheetIdent] = useState<ComponentIdentItem | null>(null);

  const colInputRefs = useRef<Record<keyof PlmColumnFilters, HTMLInputElement | null>>({
    ident: null,
    part_name: null,
    manufacturer_part_number: null,
    provider: null,
    package_type: null,
    manufacturer: null,
    unit: null,
  });

  const isStandAloneWildcard = (val: string) => {
    const v = val.trim();
    return v === '%%' || v === '%';
  };

  const fetchIdentsPage = useCallback(
    async ({
      offsetParam = 0,
      reset = false,
      filters = appliedFilters,
      isAll = isAllActive,
    }: {
      offsetParam?: number;
      reset?: boolean;
      filters?: PlmColumnFilters;
      isAll?: boolean;
    }) => {
      try {
        const params = new URLSearchParams();
        params.append('limit', '50');
        params.append('offset', String(offsetParam));

        if (!isAll) {
          if (filters.ident.trim()) params.append('ident', filters.ident.trim());
          if (filters.part_name.trim()) params.append('part_name', filters.part_name.trim());
          if (filters.manufacturer_part_number.trim())
            params.append('manufacturer_part_number', filters.manufacturer_part_number.trim());
          if (filters.provider.trim()) params.append('provider', filters.provider.trim());
          if (filters.package_type.trim()) params.append('package_type', filters.package_type.trim());
          if (filters.manufacturer.trim()) params.append('manufacturer', filters.manufacturer.trim());
          if (filters.unit.trim()) params.append('unit', filters.unit.trim());
        }

        const res = await fetch(`/api/v1/idents?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Eroare la încărcarea catalogului PLM.');
        }

        const newItems: ComponentIdentItem[] = Array.isArray(json.data) ? json.data : [];
        setTotalCount(typeof json.total === 'number' ? json.total : newItems.length);
        setHasMore(Boolean(json.has_more));
        setOffset(offsetParam + newItems.length);

        if (reset) {
          setIdents(newItems);
        } else {
          setIdents((prev) => {
            const existing = new Set(prev.map((i) => i.ident));
            const fresh = newItems.filter((i) => !existing.has(i.ident));
            return [...prev, ...fresh];
          });
        }
      } catch (err: unknown) {
        setTableNotice(err instanceof Error ? err.message : 'Eroare la încărcarea datelor.');
      }
    },
    [appliedFilters, isAllActive]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDatasheetIdent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveQuery = useMemo(() => {
    return isAllActive || Object.values(appliedFilters).some((val) => val.trim().length > 0);
  }, [isAllActive, appliedFilters]);

  const queriedIdents = useMemo(() => {
    if (!hasActiveQuery) {
      return [];
    }
    return idents;
  }, [idents, hasActiveQuery]);

  const handleTableScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
      setIsLoadingMore(true);
      fetchIdentsPage({ offsetParam: offset, reset: false }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  const handleDraftFilterChange = (field: keyof PlmColumnFilters, value: string) => {
    if (isStandAloneWildcard(value)) {
      setTableNotice(
        lang === 'ro'
          ? 'Nu puteți selecta toate elementele deoarece îngreunează baza de date.'
          : 'You cannot select all elements as it slows down the database.'
      );
    } else if (tableNotice) {
      setTableNotice(null);
    }
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilterKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const hasStandalone = Object.values(draftFilters).some(isStandAloneWildcard);
      if (hasStandalone) {
        setTableNotice(
          lang === 'ro'
            ? 'Nu puteți selecta toate elementele deoarece îngreunează baza de date.'
            : 'You cannot select all elements as it slows down the database.'
        );
        return;
      }

      const hasAnyVal = Object.values(draftFilters).some((val) => val.trim().length > 0);
      if (!hasAnyVal) {
        return;
      }

      setTableNotice(null);
      setIsAllActive(false);
      setAppliedFilters(draftFilters);
      fetchIdentsPage({
        offsetParam: 0,
        reset: true,
        filters: draftFilters,
        isAll: false,
      });
    }
  };

  const handleLoadTop50All = () => {
    setTableNotice(null);
    setIsAllActive(true);
    setDraftFilters(EMPTY_PLM_FILTERS);
    setAppliedFilters(EMPTY_PLM_FILTERS);
    fetchIdentsPage({
      offsetParam: 0,
      reset: true,
      filters: EMPTY_PLM_FILTERS,
      isAll: true,
    });
  };

  const handleResetFilters = () => {
    setDraftFilters(EMPTY_PLM_FILTERS);
    setAppliedFilters(EMPTY_PLM_FILTERS);
    setIsAllActive(false);
    setIdents([]);
    setTotalCount(0);
    setOffset(0);
    setHasMore(false);
    setTableNotice(null);
  };

  const handleExportCsv = () => {
    if (queriedIdents.length === 0) return;
    const headers = [
      'Ident',
      'Denumire componentă',
      'Cod producător (MPN)',
      'Furnizor',
      'Tip capsulă',
      'Producător',
      'Unitate',
      'Datasheet',
    ];
    const rows = queriedIdents.map((item) => [
      item.ident,
      `"${(item.part_name || '').replace(/"/g, '""')}"`,
      `"${(item.manufacturer_part_number || '').replace(/"/g, '""')}"`,
      `"${(item.provider || '').replace(/"/g, '""')}"`,
      `"${(item.package_type || '').replace(/"/g, '""')}"`,
      `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
      `"${(item.unit || '').replace(/"/g, '""')}"`,
      item.has_datasheet ? `Datasheet-${item.ident}.pdf` : 'Lipsă',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `plm_nomenclator_identuri_${getCurrentDateInput()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const focusColumnInput = (field: keyof PlmColumnFilters) => {
    colInputRefs.current[field]?.focus();
  };

  const emptyRowsCount = useMemo(() => {
    const loadedCount = queriedIdents.length;
    if (loadedCount >= MIN_EMPTY_TABLE_ROWS) {
      return 1;
    }
    return Math.max(1, MIN_EMPTY_TABLE_ROWS - loadedCount);
  }, [queriedIdents.length]);

  return (
    <div className="magazie-workspace-split">
      {/* Bara laterală stânga cu butoane rotunde */}
      <aside className="magazie-left-rail" aria-label="Acțiuni PLM">
        <div className="magazie-rail-group">
          {/* Buton Toate (%%) */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className={`magazie-round-btn ${isAllActive ? 'active' : ''}`}
              onClick={handleLoadTop50All}
              title={
                lang === 'ro'
                  ? 'Încarcă primele 50 de componente din catalog (defilați pentru mai multe)'
                  : 'Load first 50 components (scroll for more)'
              }
              aria-label="Toate"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">Toate (%%)</span>
          </div>

          {/* Buton Resetează */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              onClick={handleResetFilters}
              title={lang === 'ro' ? 'Resetează filtrele și tabelul' : 'Reset filters and table'}
              aria-label="Resetează"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Resetează' : 'Reset'}
            </span>
          </div>

          {/* Buton Export CSV */}
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              onClick={handleExportCsv}
              disabled={queriedIdents.length === 0}
              title={
                lang === 'ro'
                  ? 'Exportă datele interogate în fișier CSV'
                  : 'Export queried data to CSV'
              }
              aria-label="Exportă CSV"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <span className="magazie-round-btn-label">Export CSV</span>
          </div>
        </div>
      </aside>

      {/* Spațiu principal cu tabelul PLM */}
      <main className="magazie-table-fullpage">
        {/* Banner notificare */}
        {tableNotice && (
          <div className="magazie-table-notice" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{tableNotice}</span>
            <button
              type="button"
              className="magazie-notice-close"
              onClick={() => setTableNotice(null)}
              aria-label="Închide"
            >
              ✕
            </button>
          </div>
        )}

        {hasActiveQuery && (
          <div className="magazie-table-toolbar-info">
            <span>
              {lang === 'ro'
                ? `Afișate ${queriedIdents.length} din ${totalCount} componente găsite`
                : `Showing ${queriedIdents.length} of ${totalCount} components`}
            </span>
            {hasMore && (
              <span className="magazie-count-badge">
                {lang === 'ro' ? 'Defilați pentru mai multe (top 50)' : 'Scroll for more (top 50)'}
              </span>
            )}
          </div>
        )}

        <div className="magazie-fulltable-container" onScroll={handleTableScroll}>
          <table className="magazie-pro-table" aria-label="Tabel nomenclator componente PLM">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-ident">Ident</th>
                <th className="col-name">
                  {lang === 'ro' ? 'Denumire componentă' : 'Part name'}
                </th>
                <th>{lang === 'ro' ? 'Cod producător (MPN)' : 'MPN'}</th>
                <th>{lang === 'ro' ? 'Furnizor' : 'Provider'}</th>
                <th>{lang === 'ro' ? 'Tip capsulă' : 'Package type'}</th>
                <th>{lang === 'ro' ? 'Producător' : 'Manufacturer'}</th>
                <th>{lang === 'ro' ? 'Unitate' : 'Unit'}</th>
                <th style={{ width: '130px', textAlign: 'center' }}>
                  {lang === 'ro' ? 'Fișă tehnică' : 'Datasheet'}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Rândul 1: Celule de interogare pe coloane */}
              <tr className={`magazie-query-row ${hasActiveQuery ? 'has-query' : ''}`}>
                <td className="magazie-query-idx-cell" onClick={() => focusColumnInput('ident')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('ident')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.ident = el;
                    }}
                    type="text"
                    className="magazie-cell-input ident-input"
                    value={draftFilters.ident}
                    onChange={(e) => handleDraftFilterChange('ident', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="1000..."
                    aria-label="Interogare ident"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('part_name')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.part_name = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.part_name}
                    onChange={(e) => handleDraftFilterChange('part_name', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: ATmega..."
                    aria-label="Interogare denumire"
                  />
                </td>
                <td
                  className="magazie-query-cell"
                  onClick={() => focusColumnInput('manufacturer_part_number')}
                >
                  <input
                    ref={(el) => {
                      colInputRefs.current.manufacturer_part_number = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.manufacturer_part_number}
                    onChange={(e) =>
                      handleDraftFilterChange('manufacturer_part_number', e.target.value)
                    }
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: PU, SOT..."
                    aria-label="Interogare cod piesă producător"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('provider')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.provider = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.provider}
                    onChange={(e) => handleDraftFilterChange('provider', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: Mouser..."
                    aria-label="Interogare furnizor"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('package_type')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.package_type = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.package_type}
                    onChange={(e) => handleDraftFilterChange('package_type', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: SMD, THT..."
                    aria-label="Interogare tip capsulă"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('manufacturer')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.manufacturer = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.manufacturer}
                    onChange={(e) => handleDraftFilterChange('manufacturer', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: Microchip..."
                    aria-label="Interogare producător"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('unit')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.unit = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.unit}
                    onChange={(e) => handleDraftFilterChange('unit', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="ex: buc..."
                    aria-label="Interogare unitate"
                  />
                </td>
                <td className="magazie-query-cell" style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    PDF
                  </span>
                </td>
              </tr>

              {/* Rândurile rezultate */}
              {queriedIdents.map((item, idx) => (
                <tr key={item.ident} className="magazie-data-row">
                  <td className="col-idx-cell">{idx + 1}</td>
                  <td className="magazie-ident-cell">{item.ident}</td>
                  <td className="magazie-name-cell">{item.part_name}</td>
                  <td className="magazie-mono-cell">{item.manufacturer_part_number || '-'}</td>
                  <td>{item.provider}</td>
                  <td>
                    <span className="plm-pkg-badge">{item.package_type}</span>
                  </td>
                  <td>{item.manufacturer || '-'}</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="plm-datasheet-btn"
                      onClick={() => setActiveDatasheetIdent(item)}
                      title={
                        lang === 'ro'
                          ? `Deschide fișa tehnică (datasheet) pentru ident ${item.ident}`
                          : `Open datasheet for ident ${item.ident}`
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        style={{ marginRight: '4px' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {lang === 'ro' ? 'Datasheet' : 'Datasheet'}
                    </button>
                  </td>
                </tr>
              ))}

              {isLoadingMore && (
                <tr className="magazie-loading-row">
                  <td colSpan={9}>
                    <div className="magazie-scroll-loader">
                      <span className="magazie-mini-spinner" />
                      {lang === 'ro'
                        ? 'Se încarcă încă 50 de componente...'
                        : 'Loading 50 more components...'}
                    </div>
                  </td>
                </tr>
              )}

              {/* Rânduri goale de umplere */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="magazie-blank-row">
                  <td onClick={() => focusColumnInput('ident')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('ident')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('part_name')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('manufacturer_part_number')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('provider')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('package_type')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('manufacturer')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('unit')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('ident')}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Pop-up în pagină pentru vizualizare fișă tehnică (Datasheet PDF) */}
      {activeDatasheetIdent && (
        <div
          className="magazie-modal-backdrop"
          onClick={() => setActiveDatasheetIdent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="magazie-modal-card plm-datasheet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="magazie-modal-header" style={{ flexShrink: 0, marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="plm-modal-ident-pill">{activeDatasheetIdent.ident}</span>
                <h2 className="magazie-modal-title" style={{ margin: 0 }}>
                  {activeDatasheetIdent.part_name}
                </h2>
              </div>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setActiveDatasheetIdent(null)}
                aria-label="Închide"
              >
                ✕
              </button>
            </div>

            <div className="plm-datasheet-info-bar">
              <div>
                <strong>{lang === 'ro' ? 'Cod producător:' : 'MPN:'}</strong>{' '}
                <code>{activeDatasheetIdent.manufacturer_part_number || 'N/A'}</code>
              </div>
              <div>
                <strong>{lang === 'ro' ? 'Capsulă:' : 'Package:'}</strong>{' '}
                <span>{activeDatasheetIdent.package_type}</span>
              </div>
              <div>
                <strong>{lang === 'ro' ? 'Furnizor:' : 'Provider:'}</strong>{' '}
                <span>{activeDatasheetIdent.provider}</span>
              </div>
            </div>

            <div className="plm-pdf-viewer-frame">
              <iframe
                src={`/api/v1/idents/${activeDatasheetIdent.ident}/datasheet#view=FitH`}
                title={`Datasheet ${activeDatasheetIdent.ident}`}
                className="plm-pdf-iframe"
              />
            </div>

            <div
              className="magazie-modal-actions"
              style={{ justifyContent: 'space-between', flexShrink: 0, marginTop: '10px' }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`/api/v1/idents/${activeDatasheetIdent.ident}/datasheet`}
                  target="_blank"
                  rel="noreferrer"
                  className="magazie-btn-cancel"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  ↗ {lang === 'ro' ? 'Deschide în filă nouă' : 'Open in new tab'}
                </a>
                <a
                  href={`/api/v1/idents/${activeDatasheetIdent.ident}/datasheet`}
                  download={`${activeDatasheetIdent.ident}_datasheet.pdf`}
                  className="magazie-btn-cancel"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  ⬇ {lang === 'ro' ? 'Descarcă PDF' : 'Download PDF'}
                </a>
              </div>
              <button
                type="button"
                className="magazie-btn-submit"
                onClick={() => setActiveDatasheetIdent(null)}
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

export default PlmPage;

