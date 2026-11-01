import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Language, User } from '../types';
import './FlowGeneratorView.css';
import {
  PackageIcon,
  LaserIcon,
  ChipIcon,
  EyeScanIcon,
  SolderIcon,
  ProbesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CarrierIcon,
  ZapIcon,
  PlayIcon,
  StopIcon,
  SaveIcon,
  RotateCcwIcon,
  ClipboardIcon,
  AlertTriangleIcon,
  ClockIcon,
  TruckIcon,
  XIcon,
} from './icons/IndustrialIcons';

interface FlowGeneratorViewProps {
  lang?: Language;
  currentUser?: User | null;
}

export interface GeneratorConfig {
  enabled: boolean;
  product_model: string;
  product_ident: string;
  serial_prefix_mode: 'current_date' | 'custom';
  custom_serial_prefix: string;

  // Magazie & Calitate
  auto_order_warehouse: boolean;
  order_quantity: number;
  auto_qa_inspection: boolean;
  qa_inspector_username: string;
  qa_reception_status: string;

  // Timpi ciclu la stații (secunde)
  qr_cycle_seconds: number;
  smd_cycle_seconds: number;
  aoi_cycle_seconds: number;
  tht_cycle_seconds: number;
  ict_cycle_seconds: number;
  eol_cycle_seconds: number;

  // Tranzit QR -> SMD
  qr_to_smd_seconds: number;
  qr_to_smd_pause_probability_pct: number;
  qr_to_smd_pause_min_seconds: number;
  qr_to_smd_pause_max_seconds: number;

  // Tranzit SMD -> AOI
  smd_to_aoi_min_seconds: number;
  smd_to_aoi_max_seconds: number;
  smd_to_aoi_pause_probability_pct: number;
  smd_to_aoi_pause_min_seconds: number;
  smd_to_aoi_pause_max_seconds: number;

  // Suport AOI -> THT
  carrier_min_capacity: number;
  carrier_max_capacity: number;
  carrier_default_capacity: number;
  carrier_transit_seconds: number;

  // Tranzit THT -> ICT
  tht_to_ict_min_seconds: number;
  tht_to_ict_max_seconds: number;

  // Tranzit ICT -> EOL
  ict_to_eol_min_seconds: number;
  ict_to_eol_max_seconds: number;
  ict_to_eol_default_seconds: number;

  // Rate defecte SMD
  smd_defect_aoi_pct: number;
  smd_defect_ict_pct: number;
  smd_defect_eol_pct: number;

  // Rate defecte THT
  tht_defect_ict_pct: number;
  tht_defect_eol_pct: number;

  // Rata defect QR
  qr_defect_pct: number;
}

export function FlowGeneratorView(_props: FlowGeneratorViewProps) {
  const [config, setConfig] = useState<GeneratorConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(20);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(10);
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Aggregated flow stats
  const [stats, setStats] = useState<any>(null);

  // Active settings tab
  const [activeTab, setActiveTab] = useState<'flow' | 'defects' | 'cycles' | 'buffers' | 'warehouse'>('flow');

  // Preluare configurație de pe backend
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/generator/config');
      if (!res.ok) throw new Error('Eroare la încărcarea configurației generatorului');
      const data = await res.json();
      setConfig(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Preluare statistici agregate
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/generator/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.data);
    } catch {
      // Ignorăm erorile de fundal
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  // Derulare automată în consola de log-uri
  useEffect(() => {
    if (autoScrollLogs && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [eventLogs, autoScrollLogs]);

  // Actualizare câmp din configurație
  const updateConfigField = <K extends keyof GeneratorConfig>(field: K, value: GeneratorConfig[K]) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  // Salvare setări
  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/v1/generator/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Eroare la salvarea configurației');
      }
      const data = await res.json();
      setConfig(data.data);
      setNotice('Setările au fost salvate cu succes.');
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Resetare la standardul de fabrică
  const handleResetConfig = async () => {
    if (
      !window.confirm(
        'Sigur doriți să resetați toate setările generatorului la valorile implicite din fabrică?')
    ) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/v1/generator/reset-config', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Eroare la resetarea configurației');
      const data = await res.json();
      setConfig(data.data);
      setNotice('Configurația a fost resetată la standardul din fabrică.');
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Verificare manuală magazie și analist calitate
  const handleCheckWarehouse = async () => {
    try {
      setError(null);
      const res = await fetch('/api/v1/generator/check-warehouse', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Eroare la verificarea stocului și calității');
      const data = await res.json();
      if (data.logs && data.logs.length > 0) {
        setEventLogs((prev) => [...prev, ...data.logs]);
      } else {
        setEventLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Magazie & Calitate: Stoc conform, verificat de analistul calitate.`,
        ]);
      }
      setNotice('Verificare stoc & analist calitate finalizată.');
      setTimeout(() => setNotice(null), 3500);
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Generare lot complet de plăci
  const handleGenerateBatch = async (countOverride?: number) => {
    const countToGenerate = countOverride || batchCount;
    if (countToGenerate < 1 || countToGenerate > 500) {
      setError('Numărul de plăci trebuie să fie între 1 și 500');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const res = await fetch('/api/v1/generator/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: countToGenerate,
          override_config: config,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Eroare la generarea lotului');
      }

      const data = await res.json();
      if (data.logs && data.logs.length > 0) {
        setEventLogs((prev) => [...prev, ...data.logs]);
      }

      setNotice(
        `Lot de ${countToGenerate} plăci generat (${data.first_serial} ➔ ${data.last_serial}).`);
      setTimeout(() => setNotice(null), 5000);

      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Simulare periodică Live cu auto-chain asincron fără suprapunere de cereri
  useEffect(() => {
    let timeoutId: any = null;
    let isCancelled = false;
    let isRequestActive = false;

    // Calculăm mărimea lotului și pauza în funcție de viteza selectată
    let batchSize = 1;
    let delayMs = 1000;

    if (simSpeed >= 60) {
      batchSize = 3;
      delayMs = 500;
    } else if (simSpeed >= 30) {
      batchSize = 2;
      delayMs = 600;
    } else if (simSpeed >= 10) {
      batchSize = 1;
      delayMs = 500;
    } else if (simSpeed >= 5) {
      batchSize = 1;
      delayMs = 800;
    } else {
      batchSize = 1;
      delayMs = 2500;
    }

    const runSimStep = async () => {
      if (isCancelled || isRequestActive) return;
      isRequestActive = true;

      try {
        const res = await fetch('/api/v1/generator/generate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            count: batchSize,
            override_config: config,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.logs && data.logs.length > 0) {
            setEventLogs((prev) => [...prev.slice(-200), ...data.logs]);
          }
          if (!isCancelled) {
            fetchStats();
          }
        }
      } catch {
        // Ignorăm erorile pasagere de rețea
      } finally {
        isRequestActive = false;
        if (!isCancelled && isSimulating) {
          timeoutId = setTimeout(runSimStep, delayMs);
        }
      }
    };

    if (isSimulating) {
      timeoutId = setTimeout(runSimStep, 300);
    }

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSimulating, simSpeed, config, fetchStats]);

  // Calcule automate procente defecte
  const totalSmdDefects = useMemo(() => {
    if (!config) return 0;
    return Number(
      (
        Number(config.smd_defect_aoi_pct) +
        Number(config.smd_defect_ict_pct) +
        Number(config.smd_defect_eol_pct)
      ).toFixed(2)
    );
  }, [config]);

  const smdPassRate = useMemo(() => {
    return Number((100 - totalSmdDefects).toFixed(2));
  }, [totalSmdDefects]);

  const totalThtDefects = useMemo(() => {
    if (!config) return 0;
    return Number(
      (Number(config.tht_defect_ict_pct) + Number(config.tht_defect_eol_pct)).toFixed(2)
    );
  }, [config]);

  const thtPassRate = useMemo(() => {
    return Number((100 - totalThtDefects).toFixed(2));
  }, [totalThtDefects]);

  if (loading || !config) {
    return (
      <div className="flow-gen-loading">
        <div className="flow-gen-spinner" />
        <span>
          {'Se încarcă modulul generatorului de flux...'}
        </span>
      </div>
    );
  }

  return (
    <div className="flow-gen-container">
      {/* Alerte notificare & erori */}
      {error && (
        <div className="flow-gen-alert danger">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} title="Închide">
            <XIcon size={14} />
          </button>
        </div>
      )}
      {notice && (
        <div className="flow-gen-alert success">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} title="Închide">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* HEADER & CONTROL BAR */}
      <header className="flow-gen-header">
        <div className="flow-gen-title-block">
          <div className="flow-gen-badge-row">
            <span className="flow-gen-badge primary">
              {'Generator Flux Producție PCBA'}
            </span>
            <span className="flow-gen-badge warning">
              {'Stația Export Exclusă'}
            </span>
            <span className={`flow-gen-badge ${isSimulating ? 'success pulse' : 'secondary'}`}>
              {isSimulating
                ? `Simulare Activă (${simSpeed}x)`: 'Simulare Inactivă'}
            </span>
          </div>
          <h1 className="flow-gen-main-heading">
            {'Generator de flux industrial și simulare proces'}
          </h1>
          <p className="flow-gen-subtext">
            {'Orchestrează fluxul de fabricație: Magazie ➔ Recepție Calitate ➔ QR Laser ➔ SMD ➔ AOI ➔ Suport Lot (40-60 buc) ➔ THT ➔ ICT ➔ Carcasare ➔ EOL.'}
          </p>
        </div>

        {/* Panou acțiuni rapide */}
        <div className="flow-gen-actions-card">
          <div className="flow-gen-action-group">
            <span className="flow-action-label">
              {'Generare lot:'}
            </span>
            <div className="flow-batch-controls">
              <input
                type="number"
                min="1"
                max="500"
                value={batchCount}
                onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flow-input-small"
                title="Număr de plăci de generat"
              />
              <button
                type="button"
                className="flow-btn primary"
                disabled={generating || isSimulating}
                onClick={() => handleGenerateBatch()}
              >
                {generating ? (
                  <>
                    <span className="flow-btn-spinner" />
                    {'Se generează...'}
                  </>
                ) : (
                  <>
                    <ZapIcon size={14} />
                    {`Lansează lot (${batchCount} buc)`}
                  </>
                )}
              </button>
              <button
                type="button"
                className="flow-btn secondary"
                disabled={generating || isSimulating}
                onClick={() => handleGenerateBatch(10)}
                title="Generează rapid 10 plăci"
              >
                10 buc
              </button>
              <button
                type="button"
                className="flow-btn secondary"
                disabled={generating || isSimulating}
                onClick={() => handleGenerateBatch(50)}
                title="Generează rapid 50 de plăci (1 suport plin)"
              >
                50 buc
              </button>
            </div>
          </div>

          <div className="flow-gen-action-group">
            <span className="flow-action-label">
              {'Simulare live:'}
            </span>
            <div className="flow-live-controls">
              {!isSimulating ? (
                <button
                  type="button"
                  className="flow-btn success"
                  onClick={() => setIsSimulating(true)}
                  disabled={generating}
                >
                  <PlayIcon size={13} /> {'Pornește live'}
                </button>
              ) : (
                <button
                  type="button"
                  className="flow-btn danger"
                  onClick={() => setIsSimulating(false)}
                >
                  <StopIcon size={13} /> {'Oprește live'}
                </button>
              )}

              <select
                className="flow-select-small"
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                title="Viteză simulare"
              >
                <option value={1}>1x ({'Timp real'})</option>
                <option value={5}>5x ({'Rapid'})</option>
                <option value={10}>10x ({'Accelerat'})</option>
                <option value={30}>30x (30x)</option>
                <option value={60}>60x (60x)</option>
              </select>

              <button
                type="button"
                className="flow-btn outline"
                onClick={handleCheckWarehouse}
                title="Verificare componente magazie și marcare conform de către analistul calitate"
              >
                <PackageIcon size={14} /> {'Verifică magazie & QC'}
              </button>
            </div>
          </div>

          <div className="flow-gen-action-group right">
            <button
              type="button"
              className="flow-btn save"
              disabled={saving}
              onClick={handleSaveConfig}
            >
              <SaveIcon size={14} />
              {saving ? '...' : 'Salvează'}
            </button>
            <button
              type="button"
              className="flow-btn reset"
              disabled={saving}
              onClick={handleResetConfig}
              title="Resetează toți parametrii la standardul industrial din fabrică"
            >
              <RotateCcwIcon size={14} />
              {'Reset fabrică'}
            </button>
          </div>
        </div>
      </header>

      {/* KPI DASHBOARD BAR */}
      {stats && (
        <section className="flow-kpi-bar" aria-label="Statistici producție">
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{'Total PCB Marcate'}</span>
            <span className="flow-kpi-value">{stats.qr_total || 0}</span>
            <span className="flow-kpi-sub">QR Laser 12 cifre</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{'Trecute prin SMD'}</span>
            <span className="flow-kpi-value">{stats.smd_boards_total || 0}</span>
            <span className="flow-kpi-sub">7 componente montate</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{'Inspecție AOI'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.aoi?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.aoi?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut optic</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{'Test Electric ICT'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.ict?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.ict?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut electric</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{'Test Final EOL'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.eol?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.eol?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut funcțional</span>
          </div>
          <div className="flow-kpi-card highlight">
            <span className="flow-kpi-title">{'Randament Global (Yield)'}</span>
            <span className="flow-kpi-value text-accent">{stats.yield_pct || 100}%</span>
            <span className="flow-kpi-sub">
              {stats.final_good || 0} bune / {stats.final_scrap || 0} rebutate
            </span>
          </div>
        </section>
      )}

      {/* VISUAL PIPELINE DIAGRAM - UNIFIED SLEEK SLATE */}
      <section className="flow-pipeline-section" aria-label="Diagrama vizuală a fluxului de producție">
        <div className="flow-pipeline-header">
          <h2 className="flow-section-heading">
            {'1. Arhitectura fluxului industrial de producție'}
          </h2>
          <span className="flow-section-badge">
            {'Secvență cronologică'}
          </span>
        </div>

        <div className="flow-conveyor-wrapper">
          <div className="flow-conveyor-track">
            {/* Step 0: Magazie & QC */}
            <div className="flow-station-node">
              <div className="flow-node-tag">
                {'Intrare'}
              </div>
              <div className="flow-node-icon">
                <PackageIcon size={16} />
              </div>
              <div className="flow-node-title">Magazie & QC</div>
              <div className="flow-node-desc">
                {'Comenzi stoc & analist calitate'}
              </div>
              <div className="flow-node-badges">
                <span className="node-chip">Auto: {config.auto_order_warehouse ? 'DA' : 'NU'}</span>
                <span className="node-chip success">QC: conform</span>
              </div>
            </div>

            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">Aprovizionare</span>
            </div>

            {/* Step 1: QR Laser */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Stația 1</div>
              <div className="flow-node-icon">
                <LaserIcon size={16} />
              </div>
              <div className="flow-node-title">QR Laser</div>
              <div className="flow-node-desc">Marcare serie 12 cifre YYMMDDNNNNNN</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.qr_cycle_seconds}s</span>
                <span className="node-chip success">Defect: {config.qr_defect_pct}%</span>
              </div>
            </div>

            {/* Transit QR -> SMD */}
            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">
                {config.qr_to_smd_seconds}s
                <small title="Pauze aleatorii de 1-10 minute"> (pauză 1-10m)</small>
              </span>
            </div>

            {/* Step 2: SMD */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Stația 2</div>
              <div className="flow-node-icon">
                <ChipIcon size={16} />
              </div>
              <div className="flow-node-title">Amplasare SMD</div>
              <div className="flow-node-desc">Pick & Place 7 componente (U3, U5, U2, etc.)</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.smd_cycle_seconds}s</span>
                <span className="node-chip danger">Defecte: {totalSmdDefects}%</span>
              </div>
            </div>

            {/* Transit SMD -> AOI */}
            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">
                {config.smd_to_aoi_min_seconds}-{config.smd_to_aoi_max_seconds}s
              </span>
            </div>

            {/* Step 3: AOI */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Punct 3</div>
              <div className="flow-node-icon">
                <EyeScanIcon size={16} />
              </div>
              <div className="flow-node-title">Inspecție AOI</div>
              <div className="flow-node-desc">Control optic joncțiuni & polaritate</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.aoi_cycle_seconds}s</span>
                <span className="node-chip danger">Prinde: {config.smd_defect_aoi_pct}% SMD</span>
              </div>
            </div>

            {/* Suport Lot AOI -> THT (Carrier) */}
            <div className="flow-transit-arrow highlight-carrier">
              <span className="arrow-line">➔</span>
              <span className="transit-label carrier">
                <CarrierIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Suport ({config.carrier_min_capacity}-{config.carrier_max_capacity} buc)
                <small> Transfer în bloc la THT</small>
              </span>
            </div>

            {/* Step 4: THT */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Stația 4</div>
              <div className="flow-node-icon">
                <SolderIcon size={16} />
              </div>
              <div className="flow-node-title">Amplasare THT</div>
              <div className="flow-node-desc">Montaj manual & cositorire U1 DIP28</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.tht_cycle_seconds}s</span>
                <span className="node-chip danger">Defecte: {totalThtDefects}%</span>
              </div>
            </div>

            {/* Transit THT -> ICT */}
            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">
                {config.tht_to_ict_min_seconds}-{config.tht_to_ict_max_seconds}s
              </span>
            </div>

            {/* Step 5: ICT */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Punct 5</div>
              <div className="flow-node-icon">
                <ProbesIcon size={16} />
              </div>
              <div className="flow-node-title">Test ICT</div>
              <div className="flow-node-desc">Bed-of-Nails & măsurători electrice</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.ict_cycle_seconds}s</span>
                <span className="node-chip danger">
                  Prinde: {config.smd_defect_ict_pct}% SMD + {config.tht_defect_ict_pct}% THT
                </span>
              </div>
            </div>

            {/* Transit ICT -> EOL (Carcasare) */}
            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">
                {config.ict_to_eol_min_seconds}-{config.ict_to_eol_max_seconds}s
                <small> Carcasare</small>
              </span>
            </div>

            {/* Step 6: EOL */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Punct 6</div>
              <div className="flow-node-icon">
                <ShieldCheckIcon size={16} />
              </div>
              <div className="flow-node-title">Test EOL</div>
              <div className="flow-node-desc">Test funcțional final complet</div>
              <div className="flow-node-badges">
                <span className="node-chip cycle">Ciclu: {config.eol_cycle_seconds}s</span>
                <span className="node-chip danger">
                  Pică: {config.smd_defect_eol_pct}% SMD + {config.tht_defect_eol_pct}% THT
                </span>
              </div>
            </div>

            <div className="flow-transit-arrow">
              <span className="arrow-line">➔</span>
              <span className="transit-label">Final</span>
            </div>

            {/* Output Node */}
            <div className="flow-station-node">
              <div className="flow-node-tag">Ieșire</div>
              <div className="flow-node-icon">
                <CheckCircleIcon size={16} />
              </div>
              <div className="flow-node-title">Produs Bun</div>
              <div className="flow-node-desc">Certificat 100% conform IPC-A-610G</div>
              <div className="flow-node-badges">
                <span className="node-chip success">PASS EOL</span>
                <span className="node-chip secondary">Gata ambalare</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABS DE CONFIGURARE EDITABILĂ */}
      <section className="flow-config-section" aria-label="Toate setările generatorului editabile">
        <div className="flow-tabs-header">
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            <ClipboardIcon size={14} />
            {'Configurare Generală & Serii'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'defects' ? 'active' : ''}`}
            onClick={() => setActiveTab('defects')}
          >
            <AlertTriangleIcon size={14} />
            {'Rate Defecte & Evenimente Aleatorii'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'cycles' ? 'active' : ''}`}
            onClick={() => setActiveTab('cycles')}
          >
            <ClockIcon size={14} />
            {'Timpi de Ciclu la Stații'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'buffers' ? 'active' : ''}`}
            onClick={() => setActiveTab('buffers')}
          >
            <TruckIcon size={14} />
            {'Tranzit, Buffere & Suport Lot'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'warehouse' ? 'active' : ''}`}
            onClick={() => setActiveTab('warehouse')}
          >
            <PackageIcon size={14} />
            {'Magazie & Analist Calitate'}
          </button>
        </div>

        {/* TAB 1: GENERAL & SERIALIZARE */}
        {activeTab === 'flow' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-2">
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Formatul Numărului de Serie Industrial'}
                </h3>
                <p className="flow-panel-desc">
                  {'Seriile pe toate plăcile trebuie să fie obligatoriu de 12 cifre: YYMMDD urmat de 6 cifre incrementabile zilnic (ex: 260902000001).'}
                </p>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Mod generare prefix YYMMDD:'}
                  </label>
                  <select
                    className="flow-input-field"
                    value={config.serial_prefix_mode}
                    onChange={(e: any) => updateConfigField('serial_prefix_mode', e.target.value)}
                  >
                    <option value="current_date">
                      {'Data curentă a sistemului (automat)'}
                    </option>
                    <option value="custom">
                      {'Data manuală / Prefix fix de 6 cifre'}
                    </option>
                  </select>
                </div>

                {config.serial_prefix_mode === 'custom' && (
                  <div className="flow-field-group">
                    <label className="flow-field-label">
                      {'Prefix manual 6 cifre (ex: 260902):'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="flow-input-field"
                      value={config.custom_serial_prefix}
                      onChange={(e) => updateConfigField('custom_serial_prefix', e.target.value)}
                    />
                  </div>
                )}

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Model produs PCB:'}
                  </label>
                  <input
                    type="text"
                    className="flow-input-field"
                    value={config.product_model}
                    onChange={(e) => updateConfigField('product_model', e.target.value)}
                  />
                </div>
              </div>

              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Stare & Integritate Generator'}
                </h3>
                <p className="flow-panel-desc">
                  {'Generatorul rulează pe un thread backend dedicat și este optimizat pentru viteză și stabilitate.'}
                </p>

                <div className="flow-info-box">
                  <div className="info-row">
                    <span>{'Stare modul:'}</span>
                    <strong className="text-success">{config.enabled ? 'ACTIVAT' : 'DEZACTIVAT'}</strong>
                  </div>
                  <div className="info-row">
                    <span>{'Stații integrate în flux:'}</span>
                    <strong>QR Laser, SMD, AOI, THT, ICT, EOL (6 stații)</strong>
                  </div>
                  <div className="info-row">
                    <span>{'Stație Export:'}</span>
                    <strong className="text-accent">EXCLUSĂ</strong>
                  </div>
                  <div className="info-row">
                    <span>{'Format serializare:'}</span>
                    <strong className="text-accent">12 cifre numerice (YYMMDDNNNNNN)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RATE DE DEFECTE */}
        {activeTab === 'defects' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-2">
              {/* Defecte SMD */}
              <div className="flow-panel-card">
                <div className="flow-card-head">
                  <h3 className="flow-panel-title">
                    {'Defecte de SMD (Total setat: 2.0%)'}
                  </h3>
                  <span className="flow-badge danger">Total: {totalSmdDefects}%</span>
                </div>
                <p className="flow-panel-desc">
                  {'Componentele SMD au o probabilitate totală de defect de 2.0%, repartizată pe stațiile din aval:'}
                </p>

                {/* SMD prins la AOI */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Prinse la AOI (Inspecție optică):'}</span>
                    <strong>{config.smd_defect_aoi_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={config.smd_defect_aoi_pct}
                    onChange={(e) => updateConfigField('smd_defect_aoi_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Rebutat imediat la AOI (punți cositor, componente lipsă, tombstone).'}
                  </div>
                </div>

                {/* SMD prins la ICT */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Prinse la ICT (Test in-circuit):'}</span>
                    <strong>{config.smd_defect_ict_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.smd_defect_ict_pct}
                    onChange={(e) => updateConfigField('smd_defect_ict_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Scapă de AOI și este depistat la testul electric ICT (scurtcircuit alimentare, rezonator defect).'}
                  </div>
                </div>

                {/* SMD scăpat la EOL */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Scăpate la EOL (Test final):'}</span>
                    <strong>{config.smd_defect_eol_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.smd_defect_eol_pct}
                    onChange={(e) => updateConfigField('smd_defect_eol_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Pică la testarea finală EOL din cauza SMD (eroare protocol USB, supracurent LDO).'}
                  </div>
                </div>

                <div className="flow-summary-chip success">
                  <span>{'Rată conformă SMD (trec, sunt bune):'}</span>
                  <strong>{smdPassRate}%</strong>
                </div>
              </div>

              {/* Defecte THT & QR */}
              <div className="flow-panel-card">
                <div className="flow-card-head">
                  <h3 className="flow-panel-title">
                    {'Defecte de THT (Total setat: 1.5%)'}
                  </h3>
                  <span className="flow-badge danger">Total: {totalThtDefects}%</span>
                </div>
                <p className="flow-panel-desc">
                  {'Componentele THT (U1 ATmega328P DIP-28, headere) au o rată de defect de 1.5%:'}
                </p>

                {/* THT prins la ICT */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Prinse de ICT (Bed-of-Nails):'}</span>
                    <strong>{config.tht_defect_ict_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.tht_defect_ict_pct}
                    onChange={(e) => updateConfigField('tht_defect_ict_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Lipitură rece, pin U1 nesudat sau punte pe headere prinsă la ICT.'}
                  </div>
                </div>

                {/* THT scăpat la EOL */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Prinse de EOL (Test final):'}</span>
                    <strong>{config.tht_defect_eol_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.tht_defect_eol_pct}
                    onChange={(e) => updateConfigField('tht_defect_eol_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Conexiune THT intermitentă depistată la vibrații/carcasare EOL.'}
                  </div>
                </div>

                <div className="flow-summary-chip success">
                  <span>{'Rată conformă THT (trec, sunt bune):'}</span>
                  <strong>{thtPassRate}%</strong>
                </div>

                <hr className="flow-divider" />

                {/* Defect QR Laser */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{'Rată fail marcare QR Laser:'}</span>
                    <strong>{config.qr_defect_pct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.qr_defect_pct}
                    onChange={(e) => updateConfigField('qr_defect_pct', parseFloat(e.target.value))}
                    className="flow-slider"
                  />
                  <div className="slider-hint">
                    {'Conform specificației, la QR Laser nu ar trebui să fie failuri (0%).'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMPI DE CICLU LA STAȚII */}
        {activeTab === 'cycles' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-3">
              {/* QR Laser */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">1. QR Laser</h3>
                <p className="flow-panel-desc">
                  {'Timpul în care PCB-ul stă la stația de marcare laser.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Timp staționare QR (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.qr_cycle_seconds}
                    onChange={(e) => updateConfigField('qr_cycle_seconds', Math.max(1, parseInt(e.target.value) || 15))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard solicitat: 15 secunde</span>
                </div>
              </div>

              {/* SMD */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">2. Amplasare SMD</h3>
                <p className="flow-panel-desc">
                  {'Timpul în care piesa stă la mașina Pick & Place.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Timp staționare SMD (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.smd_cycle_seconds}
                    onChange={(e) => updateConfigField('smd_cycle_seconds', Math.max(1, parseInt(e.target.value) || 10))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard solicitat: 10 secunde</span>
                </div>
              </div>

              {/* AOI */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">3. Inspecție AOI</h3>
                <p className="flow-panel-desc">
                  {'Scanare optică camere HD & comparare algoritmică.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Timp inspecție AOI (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.aoi_cycle_seconds}
                    onChange={(e) => updateConfigField('aoi_cycle_seconds', Math.max(1, parseInt(e.target.value) || 10))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard industrial: 10 secunde</span>
                </div>
              </div>

              {/* THT */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">4. Amplasare & Cositorire THT</h3>
                <p className="flow-panel-desc">
                  {'Timp amplasare manuală soclu U1 & cositorire selectivă.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Timp THT (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.tht_cycle_seconds}
                    onChange={(e) => updateConfigField('tht_cycle_seconds', Math.max(1, parseInt(e.target.value) || 15))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard solicitat: 15 secunde</span>
                </div>
              </div>

              {/* ICT */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">5. Testare In-Circuit (ICT)</h3>
                <p className="flow-panel-desc">
                  {'Coborâre pat de ace (bed-of-nails) & măsurători voltaj/rezistențe.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Durată test ICT (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.ict_cycle_seconds}
                    onChange={(e) => updateConfigField('ict_cycle_seconds', Math.max(1, parseInt(e.target.value) || 30))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard solicitat: 30 secunde</span>
                </div>
              </div>

              {/* EOL */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">6. Testare Finală (EOL)</h3>
                <p className="flow-panel-desc">
                  {'Test funcțional complet în carcasă cu simulare periferice.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Durată test EOL (secunde):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={config.eol_cycle_seconds}
                    onChange={(e) => updateConfigField('eol_cycle_seconds', Math.max(1, parseInt(e.target.value) || 50))}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Standard solicitat: 50 secunde</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRANZIT, BUFFERE & SUPORT LOT */}
        {activeTab === 'buffers' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-2">
              {/* Suport AOI -> THT (IMPORTANT) */}
              <div className="flow-panel-card highlight-border">
                <div className="flow-card-head">
                  <h3 className="flow-panel-title">
                    <CarrierIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {'Suport Lot AOI ➔ THT (40 - 60 piese)'}
                  </h3>
                  <span className="flow-badge primary">Transfer în bloc</span>
                </div>
                <p className="flow-panel-desc">
                  {'Regulă critică de producție: Plăcile nu trec una câte una la THT, ci se acumulează pe tăvi suport de câte 40-60 piese și trec toate odată când tava este completă.'}
                </p>

                <div className="flow-grid-3">
                  <div className="flow-field-group">
                    <label className="flow-field-label">Capacitate minimă:</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={config.carrier_min_capacity}
                      onChange={(e) => updateConfigField('carrier_min_capacity', parseInt(e.target.value) || 40)}
                      className="flow-input-field"
                    />
                  </div>
                  <div className="flow-field-group">
                    <label className="flow-field-label">Capacitate maximă:</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={config.carrier_max_capacity}
                      onChange={(e) => updateConfigField('carrier_max_capacity', parseInt(e.target.value) || 60)}
                      className="flow-input-field"
                    />
                  </div>
                  <div className="flow-field-group">
                    <label className="flow-field-label">Capacitate implicită:</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={config.carrier_default_capacity}
                      onChange={(e) => updateConfigField('carrier_default_capacity', parseInt(e.target.value) || 50)}
                      className="flow-input-field"
                    />
                  </div>
                </div>

                <div className="flow-field-group" style={{ marginTop: '0.65rem' }}>
                  <label className="flow-field-label">Timp tranzit tavă suport (secunde):</label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={config.carrier_transit_seconds}
                    onChange={(e) => updateConfigField('carrier_transit_seconds', parseInt(e.target.value) || 60)}
                    className="flow-input-field"
                  />
                </div>
              </div>

              {/* Tranzit QR -> SMD */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Tranzit QR ➔ SMD & Pauze Producție'}
                </h3>
                <p className="flow-panel-desc">
                  {'Tranzit standard de 30 secunde cu perioade aleatorii de pauză între 1 și 10 minute.'}
                </p>

                <div className="flow-grid-2">
                  <div className="flow-field-group">
                    <label className="flow-field-label">Tranzit normal (secunde):</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={config.qr_to_smd_seconds}
                      onChange={(e) => updateConfigField('qr_to_smd_seconds', parseInt(e.target.value) || 30)}
                      className="flow-input-field"
                    />
                    <span className="field-hint">Solicitat: 30 secunde</span>
                  </div>

                  <div className="flow-field-group">
                    <label className="flow-field-label">Șansă pauză aleatorie (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={config.qr_to_smd_pause_probability_pct}
                      onChange={(e) => updateConfigField('qr_to_smd_pause_probability_pct', parseFloat(e.target.value) || 0)}
                      className="flow-input-field"
                    />
                  </div>
                </div>

                <div className="flow-grid-2" style={{ marginTop: '0.45rem' }}>
                  <div className="flow-field-group">
                    <label className="flow-field-label">Pauză minimă (secunde):</label>
                    <input
                      type="number"
                      min="10"
                      max="1800"
                      value={config.qr_to_smd_pause_min_seconds}
                      onChange={(e) => updateConfigField('qr_to_smd_pause_min_seconds', parseInt(e.target.value) || 60)}
                      className="flow-input-field"
                    />
                    <span className="field-hint">60s = 1 minut</span>
                  </div>
                  <div className="flow-field-group">
                    <label className="flow-field-label">Pauză maximă (secunde):</label>
                    <input
                      type="number"
                      min="60"
                      max="3600"
                      value={config.qr_to_smd_pause_max_seconds}
                      onChange={(e) => updateConfigField('qr_to_smd_pause_max_seconds', parseInt(e.target.value) || 600)}
                      className="flow-input-field"
                    />
                    <span className="field-hint">600s = 10 minute</span>
                  </div>
                </div>
              </div>

              {/* Tranzit SMD -> AOI */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Tranzit SMD ➔ AOI (25 - 50 secunde)'}
                </h3>
                <p className="flow-panel-desc">
                  {'Interval între cuptorul de reflow SMD și stația AOI cu pauze rare de minute.'}
                </p>

                <div className="flow-grid-2">
                  <div className="flow-field-group">
                    <label className="flow-field-label">Tranzit minim (secunde):</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={config.smd_to_aoi_min_seconds}
                      onChange={(e) => updateConfigField('smd_to_aoi_min_seconds', parseInt(e.target.value) || 25)}
                      className="flow-input-field"
                    />
                  </div>
                  <div className="flow-field-group">
                    <label className="flow-field-label">Tranzit maxim (secunde):</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={config.smd_to_aoi_max_seconds}
                      onChange={(e) => updateConfigField('smd_to_aoi_max_seconds', parseInt(e.target.value) || 50)}
                      className="flow-input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Tranzit THT -> ICT & ICT -> EOL */}
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Tranzit THT ➔ ICT & Carcasare ➔ EOL'}
                </h3>
                <p className="flow-panel-desc">
                  {'THT spre ICT durează 30-40 secunde; după ICT, carcasarea și deplasarea spre EOL sunt aleatorii.'}
                </p>

                <div className="flow-grid-2">
                  <div className="flow-field-group">
                    <label className="flow-field-label">THT ➔ ICT (min - max s):</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={config.tht_to_ict_min_seconds}
                        onChange={(e) => updateConfigField('tht_to_ict_min_seconds', parseInt(e.target.value) || 30)}
                        className="flow-input-field"
                        title="Minim"
                      />
                      <input
                        type="number"
                        value={config.tht_to_ict_max_seconds}
                        onChange={(e) => updateConfigField('tht_to_ict_max_seconds', parseInt(e.target.value) || 40)}
                        className="flow-input-field"
                        title="Maxim"
                      />
                    </div>
                  </div>

                  <div className="flow-field-group">
                    <label className="flow-field-label">Carcasare ➔ EOL (min - max s):</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={config.ict_to_eol_min_seconds}
                        onChange={(e) => updateConfigField('ict_to_eol_min_seconds', parseInt(e.target.value) || 20)}
                        className="flow-input-field"
                        title="Minim"
                      />
                      <input
                        type="number"
                        value={config.ict_to_eol_max_seconds}
                        onChange={(e) => updateConfigField('ict_to_eol_max_seconds', parseInt(e.target.value) || 50)}
                        className="flow-input-field"
                        title="Maxim"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MAGAZIE & ANALIST CALITATE */}
        {activeTab === 'warehouse' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-2">
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Comenzi Automate din Magazie'}
                </h3>
                <p className="flow-panel-desc">
                  {'Când generatorul pornește sau stocul scade sub 50 de bucăți, plasează automat comenzi de reaprovizionare în baza de date a magaziei.'}
                </p>

                <div className="flow-field-group">
                  <label className="flow-toggle-label">
                    <input
                      type="checkbox"
                      checked={config.auto_order_warehouse}
                      onChange={(e) => updateConfigField('auto_order_warehouse', e.target.checked)}
                      className="flow-toggle"
                    />
                    <span>
                      {'Activează comanda automată la stoc redus'}
                    </span>
                  </label>
                </div>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Cantitate comandată per lot (bucăți):'}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={config.order_quantity}
                    onChange={(e) => updateConfigField('order_quantity', parseInt(e.target.value) || 500)}
                    className="flow-input-field"
                  />
                  <span className="field-hint">Implicit: 500 bucăți</span>
                </div>
              </div>

              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {'Verificare Automată Analist Calitate'}
                </h3>
                <p className="flow-panel-desc">
                  {'Fiecare lot sosit în recepție este inspectat și marcat automat ca fiind CONFORM și semnat de către analistul calitate.'}
                </p>

                <div className="flow-field-group">
                  <label className="flow-toggle-label">
                    <input
                      type="checkbox"
                      checked={config.auto_qa_inspection}
                      onChange={(e) => updateConfigField('auto_qa_inspection', e.target.checked)}
                      className="flow-toggle"
                    />
                    <span>
                      {'Semnare automată de către Analist Calitate'}
                    </span>
                  </label>
                </div>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Utilizator Analist Calitate:'}
                  </label>
                  <input
                    type="text"
                    value={config.qa_inspector_username}
                    onChange={(e) => updateConfigField('qa_inspector_username', e.target.value)}
                    className="flow-input-field"
                  />
                </div>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {'Decizie recepție lot:'}
                  </label>
                  <select
                    className="flow-input-field"
                    value={config.qa_reception_status}
                    onChange={(e) => updateConfigField('qa_reception_status', e.target.value)}
                  >
                    <option value="conform">conform (Admis fără rezerve)</option>
                    <option value="in_asteptare">in_asteptare (În carantină)</option>
                    <option value="neconform">neconform (Respins)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CONSOLĂ INDUSTRIALĂ DE EVENIMENTE LIVE */}
      <section className="flow-console-section" aria-label="Jurnal evenimente producție">
        <div className="flow-console-header">
          <div className="console-title-group">
            <span className="console-dot-live" />
            <h3 className="flow-console-title">
              {'Jurnal de Evenimente & Trasabilitate Live'}
            </h3>
            <span className="console-counter">({eventLogs.length} înregistrări)</span>
          </div>

          <div className="console-controls">
            <label className="console-toggle-label">
              <input
                type="checkbox"
                checked={autoScrollLogs}
                onChange={(e) => setAutoScrollLogs(e.target.checked)}
              />
              <span>Auto-scroll</span>
            </label>
            <button
              type="button"
              className="console-btn-clear"
              onClick={() => setEventLogs([])}
            >
              {'Șterge jurnal'}
            </button>
          </div>
        </div>

        <div className="flow-console-body" ref={logContainerRef}>
          {eventLogs.length === 0 ? (
            <div className="console-empty">
              {'Jurnalul este gol. Apăsați pe „Lansează lot” sau porniți simularea live pentru a vizualiza deplasarea pieselor.'}
            </div>
          ) : (
            eventLogs.map((log, idx) => {
              let logClass = 'log-info';
              if (log.includes('FAIL') || log.includes('EROARE') || log.includes('Rebut')) {
                logClass = 'log-fail';
              } else if (log.includes('PASS') || log.includes('CONFORM') || log.includes('100% OK')) {
                logClass = 'log-pass';
              } else if (log.includes('Suport Lot') || log.includes('Pauză')) {
                logClass = 'log-carrier';
              } else if (log.includes('Magazie') || log.includes('Comandat')) {
                logClass = 'log-warehouse';
              }

              return (
                <div key={idx} className={`console-line ${logClass}`}>
                  <span className="console-idx">{idx + 1}</span>
                  <span className="console-text">{log}</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default FlowGeneratorView;
