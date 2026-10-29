import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type UIEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type {
  Language,
  WarehouseOrder,
  ComponentIdentItem,
  ColumnFilters,
} from '../types';
import { EMPTY_FILTERS, PACKAGE_TYPE_OPTIONS } from '../types';
import { formatDateTime, formatDateOnly, getCurrentDateInput } from '../utils/date';

const MIN_EMPTY_TABLE_ROWS = 24;

interface MagaziePageProps {
  lang: Language;
}

export function MagaziePage({ lang }: MagaziePageProps) {
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isAllActive, setIsAllActive] = useState<boolean>(false);
  const [tableNotice, setTableNotice] = useState<string | null>(null);

  const [identCatalog, setIdentCatalog] = useState<ComponentIdentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modale: Adaugă comandă, Adaugă ident, Editează livrare/recepție
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddIdentModalOpen, setIsAddIdentModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WarehouseOrder | null>(null);

  // Filtre pe fiecare coloană de sub antet: draftFilters (ce se tastează) și appliedFilters (aplicat doar la Enter)
  const [draftFilters, setDraftFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ColumnFilters>(EMPTY_FILTERS);

  const identInputRef = useRef<HTMLInputElement | null>(null);
  const colInputRefs = useRef<Record<keyof ColumnFilters, HTMLInputElement | null>>({
    ident: null,
    part_name: null,
    ordered_at: null,
    quantity: null,
    provider: null,
    tracking_number: null,
    arrived: null,
    arrival_time: null,
  });

  // Formular comandă nouă (fără Ajuns în depozit, fără Data sosirii, fără Număr urmărire)
  const [ident, setIdent] = useState('10002');
  const [quantity, setQuantity] = useState('500');

  // Formular ident nou în nomenclator (component_idents)
  const [newIdentName, setNewIdentName] = useState('');
  const [newIdentMpn, setNewIdentMpn] = useState('');
  const [newIdentProvider, setNewIdentProvider] = useState('Mouser Electronics');
  const [newIdentPackageOption, setNewIdentPackageOption] = useState<string>('SMD');
  const [newIdentCustomPackage, setNewIdentCustomPackage] = useState('');
  const [newIdentManufacturer, setNewIdentManufacturer] = useState('');
  const [newIdentUnit, setNewIdentUnit] = useState('buc.');

  // Formular editare livrare / recepție (pentru editor mai târziu)
  const [editTracking, setEditTracking] = useState('');
  const [editArrived, setEditArrived] = useState(false);
  const [editArrivalTime, setEditArrivalTime] = useState('');

  // Stare meniu contextual (click dreapta pe rând)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    order: WarehouseOrder;
  } | null>(null);

  // Verificare wildcard simplu introdus de utilizator (%% sau %)
  const isStandAloneWildcard = (val: string) => {
    const v = val.trim();
    return v === '%%' || v === '%';
  };

  const fetchOrdersPage = useCallback(
    async ({
      offsetParam = 0,
      reset = false,
      filters = appliedFilters,
      isAll = isAllActive,
    }: {
      offsetParam?: number;
      reset?: boolean;
      filters?: ColumnFilters;
      isAll?: boolean;
    }) => {
      try {
        const params = new URLSearchParams();
        params.append('limit', '50');
        params.append('offset', String(offsetParam));

        if (!isAll) {
          if (filters.ident.trim()) params.append('ident', filters.ident.trim());
          if (filters.part_name.trim()) params.append('part_name', filters.part_name.trim());
          if (filters.provider.trim()) params.append('provider', filters.provider.trim());
          if (filters.quantity.trim()) params.append('quantity', filters.quantity.trim());
          if (filters.tracking_number.trim()) params.append('tracking_number', filters.tracking_number.trim());
          if (filters.arrived.trim()) params.append('arrived', filters.arrived.trim());
        }

        const res = await fetch(`/api/v1/inventory?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Eroare la încărcarea comenzilor din magazie.');
        }

        const newItems: WarehouseOrder[] = Array.isArray(json.data) ? json.data : [];
        setTotalCount(typeof json.total === 'number' ? json.total : newItems.length);
        setHasMore(Boolean(json.has_more));
        setOffset(offsetParam + newItems.length);

        if (reset) {
          setOrders(newItems);
        } else {
          setOrders((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const fresh = newItems.filter((o) => !existingIds.has(o.id));
            return [...prev, ...fresh];
          });
        }
      } catch (err: unknown) {
        setTableNotice(err instanceof Error ? err.message : 'Eroare la încărcarea datelor.');
      }
    },
    [appliedFilters, isAllActive]
  );

  const fetchIdents = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/idents', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setIdentCatalog(json.data);
          if (json.data.length > 0) {
            setIdent((prev) => prev || String(json.data[0].ident));
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchIdents();
  }, [fetchIdents]);

  // Închidere meniu contextual la click oriunde sau tasta Escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setIsAddModalOpen(false);
        setIsAddIdentModalOpen(false);
        setEditingOrder(null);
      }
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Verificăm dacă există o interogare activă (fie butonul Toate %%, fie filtru confirmat cu Enter)
  const hasActiveQuery = useMemo(() => {
    return isAllActive || Object.values(appliedFilters).some((val) => val.trim().length > 0);
  }, [isAllActive, appliedFilters]);

  const queriedOrders = useMemo(() => {
    if (!hasActiveQuery) {
      return [];
    }
    return orders;
  }, [orders, hasActiveQuery]);

  // Infinite scroll: la apropierea de finalul tabelului se încarcă următoarele 50
  const handleTableScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
      setIsLoadingMore(true);
      fetchOrdersPage({ offsetParam: offset, reset: false }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  const handleDraftFilterChange = (field: keyof ColumnFilters, value: string) => {
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

      // Dacă s-a introdus doar %% sau % simplu, nu permitem interogarea și anunțăm utilizatorul
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
      setAppliedFilters({ ...draftFilters });
      setOffset(0);
      setIsLoadingMore(false);
      fetchOrdersPage({ offsetParam: 0, reset: true, filters: draftFilters, isAll: false });
    }
  };

  const focusColumnInput = (field: keyof ColumnFilters) => {
    const el = colInputRefs.current[field];
    if (el) {
      el.focus();
    }
  };

  // Butonul Toate (%%): selectează top 50, iar la scroll se încarcă câte 50
  const handleShowAllBtn = () => {
    setTableNotice(null);
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setIsAllActive(true);
    setOffset(0);
    setIsLoadingMore(false);
    fetchOrdersPage({ offsetParam: 0, reset: true, isAll: true });
  };

  const handleResetBtn = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setIsAllActive(false);
    setTableNotice(null);
    setOrders([]);
    setTotalCount(0);
    setOffset(0);
    setHasMore(false);
    setIsLoadingMore(false);
  };

  const handleExportCsv = () => {
    const rowsToExport = hasActiveQuery ? queriedOrders : [];
    if (rowsToExport.length === 0) return;

    const headers = [
      '#',
      'Ident',
      'Componenta',
      'Data comenzii',
      'Cantitate',
      'Furnizor',
      'Numar urmarire',
      'Ajuns in depozit',
      'Data sosirii',
    ];
    const csvLines = [
      headers.join(','),
      ...rowsToExport.map((o, idx) =>
        [
          idx + 1,
          `"${(o.ident || o.internal_id).toString().replace(/"/g, '""')}"`,
          `"${(o.part_name || '').replace(/"/g, '""')}"`,
          `"${formatDateTime(o.ordered_at)}"`,
          o.quantity,
          `"${(o.provider || '').replace(/"/g, '""')}"`,
          `"${(o.tracking_number || '-').replace(/"/g, '""')}"`,
          o.arrived ? 'Da' : 'Nu',
          `"${formatDateOnly(o.arrival_time)}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magazie_interogare_${getCurrentDateInput()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCatalogIdent = useMemo(() => {
    return identCatalog.find((c) => String(c.ident) === ident.trim());
  }, [identCatalog, ident]);

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseInt(quantity, 10);
    if (!ident.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
      setError(
        lang === 'ro'
          ? 'Selectați identul și introduceți o cantitate validă.'
          : 'Select an ident and enter a valid quantity.'
      );
      return;
    }

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
          part_name: selectedCatalogIdent
            ? selectedCatalogIdent.part_name
            : `Componentă #${ident.trim()}`,
          ordered_at: new Date().toISOString(),
          quantity: qtyNum,
          provider: selectedCatalogIdent ? selectedCatalogIdent.provider : 'Mouser Electronics',
          tracking_number: null,
          arrived: false,
          arrival_time: null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Eroare la salvarea comenzii.');
      }

      const savedIdent = ident.trim();
      setIsAddModalOpen(false);
      setTableNotice(null);
      setIsAllActive(false);
      const nextFilter = {
        ...EMPTY_FILTERS,
        ident: savedIdent,
      };
      setDraftFilters(nextFilter);
      setAppliedFilters(nextFilter);
      setOffset(0);
      await fetchOrdersPage({ offsetParam: 0, reset: true, filters: nextFilter, isAll: false });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la salvarea comenzii.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIdent = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const resolvedPackageType =
      newIdentPackageOption === 'Altele'
        ? newIdentCustomPackage.trim()
        : newIdentPackageOption;

    if (
      !newIdentName.trim() ||
      !newIdentMpn.trim() ||
      !newIdentProvider.trim() ||
      !resolvedPackageType
    ) {
      setError(
        lang === 'ro'
          ? 'Completați toate câmpurile obligatorii pentru ident.'
          : 'Please fill in all required ident fields.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/idents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          part_name: newIdentName.trim(),
          manufacturer_part_number: newIdentMpn.trim(),
          provider: newIdentProvider.trim(),
          package_type: resolvedPackageType,
          manufacturer: newIdentManufacturer.trim() || null,
          unit: newIdentUnit.trim() || 'buc.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Eroare la salvarea identului.');
      }

      await fetchIdents();
      if (data.data?.ident) {
        setIdent(String(data.data.ident));
      }
      setNewIdentName('');
      setNewIdentMpn('');
      setNewIdentCustomPackage('');
      setNewIdentManufacturer('');
      setIsAddIdentModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la salvarea identului.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditOrder = (order: WarehouseOrder) => {
    setContextMenu(null);
    setError(null);
    setEditingOrder(order);
    setEditTracking(order.tracking_number || '');
    setEditArrived(Boolean(order.arrived));
    setEditArrivalTime(
      order.arrival_time ? order.arrival_time.slice(0, 10) : ''
    );
  };

  const handleSaveEditOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/inventory/${editingOrder.id}/arrival`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          arrived: editArrived,
          arrival_time: editArrivalTime ? editArrivalTime : null,
          tracking_number: editTracking.trim() ? editTracking.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Eroare la actualizarea comenzii.');
      }
      if (data.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.data.id ? { ...o, ...data.data } : o))
        );
      }
      setEditingOrder(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la actualizarea comenzii.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowContextMenu = (e: ReactMouseEvent, order: WarehouseOrder) => {
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
          arrival_time: targetArrived ? getCurrentDateInput() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, ...data.data } : o))
        );
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
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
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

  const emptyRowsCount = Math.max(0, MIN_EMPTY_TABLE_ROWS - queriedOrders.length);

  return (
    <div className="magazie-workspace-split">
      {/* Coloana din stânga: Butoane rotunde în coloană */}
      <aside className="magazie-left-rail" aria-label="Acțiuni magazie">
        <div className="magazie-rail-group">
          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn primary"
              onClick={() => {
                setError(null);
                setIsAddModalOpen(true);
              }}
              title={lang === 'ro' ? 'Adaugă comandă nouă' : 'Add new order'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Adaugă comandă' : 'Add order'}
            </span>
          </div>

          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              onClick={() => {
                setError(null);
                setIsAddIdentModalOpen(true);
              }}
              title={lang === 'ro' ? 'Adaugă ident nou în nomenclator' : 'Add new ident to catalog'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Adaugă ident' : 'Add ident'}
            </span>
          </div>

          <div className="magazie-round-btn-item">
            <button
              type="button"
              className={`magazie-round-btn ${isAllActive ? 'active' : ''}`}
              onClick={handleShowAllBtn}
              title={
                lang === 'ro'
                  ? 'Afișează comenzi (top 50, derulare pentru încărcare)'
                  : 'Show orders (top 50, scroll to load)'
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Toate (%%)' : 'All (%%)'}
            </span>
          </div>

          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              onClick={handleResetBtn}
              title={lang === 'ro' ? 'Golește interogarea / Resetează tabelul' : 'Clear query / Reset table'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Resetează' : 'Reset'}
            </span>
          </div>

          <div className="magazie-round-btn-item">
            <button
              type="button"
              className="magazie-round-btn"
              onClick={handleExportCsv}
              disabled={queriedOrders.length === 0}
              title={lang === 'ro' ? 'Exportă rezultatele în CSV' : 'Export results to CSV'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <span className="magazie-round-btn-label">
              {lang === 'ro' ? 'Exportă CSV' : 'Export CSV'}
            </span>
          </div>
        </div>
      </aside>

      {/* Zona principală: Tabel gol până în josul paginii cu antet stilizat profesional */}
      <main className="magazie-table-fullpage">
        {tableNotice && (
          <div className="magazie-table-notice" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
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

        <div className="magazie-table-toolbar-info">
          <span>
            {lang === 'ro'
              ? 'Click dreapta pe rând pentru acțiuni'
              : 'Right-click row for actions'}
          </span>
          {hasActiveQuery && (
            <span className="magazie-count-badge">
              {lang === 'ro'
                ? `Afișate ${orders.length} din ${totalCount} comenzi`
                : `Showing ${orders.length} of ${totalCount} orders`}
              {hasMore
                ? lang === 'ro'
                  ? ' • Derulați în jos pentru a încărca mai multe'
                  : ' • Scroll down to load more'
                : ''}
            </span>
          )}
        </div>

        <div className="magazie-fulltable-container" onScroll={handleTableScroll}>
          <table className="magazie-pro-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-ident">Ident</th>
                <th className="col-name">{lang === 'ro' ? 'Componentă' : 'Component'}</th>
                <th className="col-date">{lang === 'ro' ? 'Data comenzii' : 'Order date'}</th>
                <th className="col-qty">{lang === 'ro' ? 'Cantitate' : 'Quantity'}</th>
                <th className="col-provider">{lang === 'ro' ? 'Furnizor' : 'Provider'}</th>
                <th className="col-tracking">{lang === 'ro' ? 'Număr urmărire' : 'Tracking number'}</th>
                <th className="col-arrived">{lang === 'ro' ? 'Ajuns în depozit' : 'Arrived in warehouse'}</th>
                <th className="col-arrival-time">{lang === 'ro' ? 'Data sosirii' : 'Arrival time'}</th>
              </tr>
            </thead>
            <tbody>
              {/* Primul rând de sub antet: celule de interogare (se aplică la apăsarea tastei Enter) */}
              <tr className={`magazie-query-row ${hasActiveQuery ? 'has-query' : ''}`}>
                <td className="magazie-query-idx-cell">
                  {hasActiveQuery ? '🔎' : ''}
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('ident')}>
                  <input
                    ref={(el) => {
                      identInputRef.current = el;
                      colInputRefs.current.ident = el;
                    }}
                    type="text"
                    className="magazie-cell-input ident-input"
                    value={draftFilters.ident}
                    onChange={(e) => handleDraftFilterChange('ident', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
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
                    aria-label="Interogare componentă"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('ordered_at')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.ordered_at = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.ordered_at}
                    onChange={(e) => handleDraftFilterChange('ordered_at', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    aria-label="Interogare data comenzii"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('quantity')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.quantity = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.quantity}
                    onChange={(e) => handleDraftFilterChange('quantity', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    aria-label="Interogare cantitate"
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
                    aria-label="Interogare furnizor"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('tracking_number')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.tracking_number = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.tracking_number}
                    onChange={(e) => handleDraftFilterChange('tracking_number', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    aria-label="Interogare număr urmărire"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('arrived')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.arrived = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.arrived}
                    onChange={(e) => handleDraftFilterChange('arrived', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    aria-label="Interogare ajuns în depozit"
                  />
                </td>
                <td className="magazie-query-cell" onClick={() => focusColumnInput('arrival_time')}>
                  <input
                    ref={(el) => {
                      colInputRefs.current.arrival_time = el;
                    }}
                    type="text"
                    className="magazie-cell-input"
                    value={draftFilters.arrival_time}
                    onChange={(e) => handleDraftFilterChange('arrival_time', e.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    aria-label="Interogare data sosirii"
                  />
                </td>
              </tr>

              {/* Rândurile rezultate în urma interogării cu Enter sau butonul Toate */}
              {queriedOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  className="magazie-data-row"
                  onContextMenu={(e) => handleRowContextMenu(e, order)}
                  title={
                    lang === 'ro'
                      ? 'Click dreapta pentru acțiuni (Editează recepția / Confirmă sosirea / Anulează comanda)'
                      : 'Right-click for actions'
                  }
                >
                  <td className="col-idx-cell">{idx + 1}</td>
                  <td className="magazie-ident-cell">{order.ident || order.internal_id}</td>
                  <td className="magazie-name-cell">{order.part_name}</td>
                  <td>{formatDateTime(order.ordered_at)}</td>
                  <td>{order.quantity} buc.</td>
                  <td>{order.provider}</td>
                  <td className="magazie-mono-cell">{order.tracking_number || '-'}</td>
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
              ))}

              {isLoadingMore && (
                <tr className="magazie-loading-row">
                  <td colSpan={9}>
                    <div className="magazie-scroll-loader">
                      <span className="magazie-mini-spinner" />
                      {lang === 'ro'
                        ? 'Se încarcă încă 50 de comenzi...'
                        : 'Loading 50 more orders...'}
                    </div>
                  </td>
                </tr>
              )}

              {/* Rânduri goale până în josul paginii */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="magazie-blank-row">
                  <td onClick={() => focusColumnInput('ident')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('ident')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('part_name')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('ordered_at')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('quantity')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('provider')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('tracking_number')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('arrived')}>&nbsp;</td>
                  <td onClick={() => focusColumnInput('arrival_time')}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal 1: Înregistrare comandă nouă */}
      {isAddModalOpen && (
        <div
          className="magazie-modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="magazie-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="magazie-modal-header">
              <h2 className="magazie-modal-title">
                {lang === 'ro' ? 'Înregistrare comandă nouă' : 'Register new component order'}
              </h2>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <div className="magazie-standard-error">{error}</div>}

            <form onSubmit={handleCreateOrder} className="magazie-modal-form">
              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="mag-ident">{lang === 'ro' ? 'Ident componentă' : 'Component ident'}</label>
                <select
                  id="mag-ident"
                  value={ident}
                  onChange={(e) => setIdent(e.target.value)}
                  disabled={submitting}
                >
                  {identCatalog.map((item) => (
                    <option key={item.ident} value={String(item.ident)}>
                      {item.ident} — {item.part_name} ({item.package_type} • {item.provider})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCatalogIdent && (
                <div className="magazie-ident-preview" style={{ gridColumn: 'span 2' }}>
                  <div>
                    <strong>{lang === 'ro' ? 'Furnizor:' : 'Provider:'}</strong>{' '}
                    {selectedCatalogIdent.provider}
                  </div>
                  <div>
                    <strong>{lang === 'ro' ? 'Cod producător:' : 'MPN:'}</strong>{' '}
                    {selectedCatalogIdent.manufacturer_part_number}
                  </div>
                  <div>
                    <strong>{lang === 'ro' ? 'Tip capsulă:' : 'Package type:'}</strong>{' '}
                    {selectedCatalogIdent.package_type}
                  </div>
                </div>
              )}

              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
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

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button type="submit" className="magazie-btn-submit" disabled={submitting}>
                  {submitting
                    ? lang === 'ro'
                      ? 'Se salvează...'
                      : 'Saving...'
                    : lang === 'ro'
                      ? 'Plasează comanda'
                      : 'Place order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adăugare ident nou în nomenclatorul component_idents */}
      {isAddIdentModalOpen && (
        <div
          className="magazie-modal-backdrop"
          onClick={() => setIsAddIdentModalOpen(false)}
        >
          <div
            className="magazie-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="magazie-modal-header">
              <h2 className="magazie-modal-title">
                {lang === 'ro' ? 'Adăugare ident nou în nomenclator' : 'Add new ident to catalog'}
              </h2>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setIsAddIdentModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <div className="magazie-standard-error">{error}</div>}

            <form onSubmit={handleCreateIdent} className="magazie-modal-form">
              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="ident-name">
                  {lang === 'ro' ? 'Denumire componentă' : 'Component name'}
                </label>
                <input
                  id="ident-name"
                  type="text"
                  placeholder="ex: ATmega328P (Microcontroler 8-bit AVR)"
                  value={newIdentName}
                  onChange={(e) => setNewIdentName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="magazie-form-field">
                <label htmlFor="ident-mpn">
                  {lang === 'ro' ? 'Codul piesei de la producător' : 'Manufacturer part number'}
                </label>
                <input
                  id="ident-mpn"
                  type="text"
                  placeholder="ex: ATMEGA328P-PU"
                  value={newIdentMpn}
                  onChange={(e) => setNewIdentMpn(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="magazie-form-field">
                <label htmlFor="ident-provider">
                  {lang === 'ro' ? 'Furnizor' : 'Provider'}
                </label>
                <input
                  id="ident-provider"
                  type="text"
                  placeholder="ex: Mouser Electronics"
                  value={newIdentProvider}
                  onChange={(e) => setNewIdentProvider(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="magazie-form-field">
                <label htmlFor="ident-pkg">
                  {lang === 'ro' ? 'Tipul de capsulă' : 'Package type'}
                </label>
                <select
                  id="ident-pkg"
                  value={newIdentPackageOption}
                  onChange={(e) => setNewIdentPackageOption(e.target.value)}
                  disabled={submitting}
                >
                  {PACKAGE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="magazie-form-field">
                <label htmlFor="ident-unit">
                  {lang === 'ro' ? 'Unitate de măsură' : 'Unit of measure'}
                </label>
                <input
                  id="ident-unit"
                  type="text"
                  placeholder="ex: buc., rolă, m, g"
                  value={newIdentUnit}
                  onChange={(e) => setNewIdentUnit(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {newIdentPackageOption === 'Altele' && (
                <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="ident-pkg-custom">
                    {lang === 'ro' ? 'Specifică tipul de capsulă' : 'Specify package type'}
                  </label>
                  <input
                    id="ident-pkg-custom"
                    type="text"
                    placeholder={
                      lang === 'ro'
                        ? 'Introduceți tipul de capsulă...'
                        : 'Enter custom package type...'
                    }
                    value={newIdentCustomPackage}
                    onChange={(e) => setNewIdentCustomPackage(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              )}

              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="ident-manufacturer">
                  {lang === 'ro' ? 'Producător (opțional)' : 'Manufacturer (optional)'}
                </label>
                <input
                  id="ident-manufacturer"
                  type="text"
                  placeholder="ex: Microchip, Texas Instruments"
                  value={newIdentManufacturer}
                  onChange={(e) => setNewIdentManufacturer(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setIsAddIdentModalOpen(false)}
                  disabled={submitting}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button type="submit" className="magazie-btn-submit" disabled={submitting}>
                  {submitting
                    ? lang === 'ro'
                      ? 'Se salvează...'
                      : 'Saving...'
                    : lang === 'ro'
                      ? 'Salvează identul'
                      : 'Save ident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Editează livrarea / recepția (accesibil prin click dreapta de către editor) */}
      {editingOrder && (
        <div
          className="magazie-modal-backdrop"
          onClick={() => setEditingOrder(null)}
        >
          <div
            className="magazie-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="magazie-modal-header">
              <h2 className="magazie-modal-title">
                {lang === 'ro' ? 'Editează livrarea / recepția' : 'Edit delivery / reception'}
              </h2>
              <button
                type="button"
                className="magazie-modal-close"
                onClick={() => setEditingOrder(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <div className="magazie-standard-error">{error}</div>}

            <form onSubmit={handleSaveEditOrder} className="magazie-modal-form">
              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                <label>
                  {lang === 'ro' ? 'Comandă selectată' : 'Selected order'}
                </label>
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <strong>{editingOrder.ident || editingOrder.internal_id}</strong> — {editingOrder.part_name} ({editingOrder.quantity} buc. • {editingOrder.provider})
                </div>
              </div>

              <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="edit-tracking">
                  {lang === 'ro' ? 'Număr urmărire (Tracking number / AWB)' : 'Tracking number (AWB)'}
                </label>
                <input
                  id="edit-tracking"
                  type="text"
                  placeholder="ex: DHL-884920199, FDX-392011483"
                  value={editTracking}
                  onChange={(e) => setEditTracking(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="magazie-form-field">
                <label htmlFor="edit-arrived">
                  {lang === 'ro' ? 'Ajuns în depozit?' : 'Arrived in warehouse?'}
                </label>
                <select
                  id="edit-arrived"
                  value={editArrived ? 'da' : 'nu'}
                  onChange={(e) => {
                    const isYes = e.target.value === 'da';
                    setEditArrived(isYes);
                    if (isYes && !editArrivalTime) {
                      setEditArrivalTime(getCurrentDateInput());
                    }
                  }}
                  disabled={submitting}
                >
                  <option value="nu">{lang === 'ro' ? 'Nu (În tranzit)' : 'No (In transit)'}</option>
                  <option value="da">{lang === 'ro' ? 'Da (Recepționat fizic)' : 'Yes (Received physically)'}</option>
                </select>
              </div>

              <div className="magazie-form-field">
                <label htmlFor="edit-arrival-time">
                  {lang === 'ro' ? 'Data sosirii' : 'Arrival date'}
                </label>
                <input
                  id="edit-arrival-time"
                  type="date"
                  value={editArrivalTime}
                  onChange={(e) => setEditArrivalTime(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="magazie-modal-actions">
                <button
                  type="button"
                  className="magazie-btn-cancel"
                  onClick={() => setEditingOrder(null)}
                  disabled={submitting}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button type="submit" className="magazie-btn-submit" disabled={submitting}>
                  {submitting
                    ? lang === 'ro'
                      ? 'Se actualizează...'
                      : 'Updating...'
                    : lang === 'ro'
                      ? 'Salvează modificările'
                      : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meniu contextual la click dreapta */}
      {contextMenu && (
        <div
          className="magazie-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="magazie-ctx-header">
            Comandă #{contextMenu.order.ident || contextMenu.order.internal_id}
          </div>
          <button
            type="button"
            className="magazie-ctx-item"
            onClick={() => handleOpenEditOrder(contextMenu.order)}
          >
            ✏️ {lang === 'ro' ? 'Editează livrarea / recepția' : 'Edit delivery / reception'}
          </button>
          {!contextMenu.order.arrived ? (
            <button
              type="button"
              className="magazie-ctx-item"
              onClick={() => handleSetArrival(contextMenu.order, true)}
            >
              ✅ {lang === 'ro' ? 'Marchează ca ajuns în depozit' : 'Mark as arrived'}
            </button>
          ) : (
            <button
              type="button"
              className="magazie-ctx-item"
              onClick={() => handleSetArrival(contextMenu.order, false)}
            >
              ↩️ {lang === 'ro' ? 'Revenire la starea «În tranzit»' : 'Revert to in transit'}
            </button>
          )}
          {contextMenu.order.tracking_number && (
            <button
              type="button"
              className="magazie-ctx-item"
              onClick={() => handleCopyTrackingNumber(contextMenu.order)}
            >
              📋 {lang === 'ro' ? 'Copiază numărul de urmărire' : 'Copy tracking number'}
            </button>
          )}
          <div className="magazie-ctx-divider" />
          <button
            type="button"
            className="magazie-ctx-item danger"
            onClick={() => handleCancelOrder(contextMenu.order)}
          >
            🗑️ {lang === 'ro' ? 'Șterge comanda' : 'Delete order'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MagaziePage;
