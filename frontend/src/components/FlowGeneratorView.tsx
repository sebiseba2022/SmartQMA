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
  lang: Language;
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

export function FlowGeneratorView({ lang }: FlowGeneratorViewProps) {
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
      setNotice(lang === 'ro' ? 'Setările au fost salvate cu succes.' : 'Settings saved successfully.');
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
        lang === 'ro'
          ? 'Sigur doriți să resetați toate setările generatorului la valorile implicite din fabrică?'
          : 'Are you sure you want to reset all generator settings to factory defaults?'
      )
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
      setNotice(lang === 'ro' ? 'Configurația a fost resetată la standardul din fabrică.' : 'Configuration reset to factory standard.');
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
      setNotice(lang === 'ro' ? 'Verificare stoc & analist calitate finalizată.' : 'Warehouse & QA check completed.');
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
      setError(lang === 'ro' ? 'Numărul de plăci trebuie să fie între 1 și 500' : 'Number of boards must be between 1 and 500');
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
        lang === 'ro'
          ? `Lot de ${countToGenerate} plăci generat (${data.first_serial} ➔ ${data.last_serial}).`
          : `Batch of ${countToGenerate} boards generated (${data.first_serial} ➔ ${data.last_serial}).`
      );
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
          {lang === 'ro'
            ? 'Se încarcă modulul generatorului de flux...'
            : 'Loading production flow generator...'}
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
              {lang === 'ro' ? 'Generator Flux Producție PCBA' : 'PCBA Flow Generator'}
            </span>
            <span className="flow-gen-badge warning">
              {lang === 'ro' ? 'Stația Export Exclusă' : 'Export Excluded'}
            </span>
            <span className={`flow-gen-badge ${isSimulating ? 'success pulse' : 'secondary'}`}>
              {isSimulating
                ? lang === 'ro'
                  ? `Simulare Activă (${simSpeed}x)`
                  : `Simulation Running (${simSpeed}x)`
                : lang === 'ro'
                ? 'Simulare Inactivă'
                : 'Simulation Inactive'}
            </span>
          </div>
          <h1 className="flow-gen-main-heading">
            {lang === 'ro'
              ? 'Generator de flux industrial și simulare proces'
              : 'Industrial flow generator & process simulation'}
          </h1>
          <p className="flow-gen-subtext">
            {lang === 'ro'
              ? 'Orchestrează fluxul de fabricație: Magazie ➔ Recepție Calitate ➔ QR Laser ➔ SMD ➔ AOI ➔ Suport Lot (40-60 buc) ➔ THT ➔ ICT ➔ Carcasare ➔ EOL.'
              : 'Orchestrates manufacturing flow: Warehouse ➔ QA Inspection ➔ QR Laser ➔ SMD ➔ AOI ➔ Carrier Lot (40-60 pcs) ➔ THT ➔ ICT ➔ Casing ➔ EOL.'}
          </p>
        </div>

        {/* Panou acțiuni rapide */}
        <div className="flow-gen-actions-card">
          <div className="flow-gen-action-group">
            <span className="flow-action-label">
              {lang === 'ro' ? 'Generare lot:' : 'Batch generation:'}
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
                    {lang === 'ro' ? 'Se generează...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <ZapIcon size={14} />
                    {lang === 'ro' ? `Lansează lot (${batchCount} buc)` : `Run batch (${batchCount} pcs)`}
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
              {lang === 'ro' ? 'Simulare live:' : 'Live simulation:'}
            </span>
            <div className="flow-live-controls">
              {!isSimulating ? (
                <button
                  type="button"
                  className="flow-btn success"
                  onClick={() => setIsSimulating(true)}
                  disabled={generating}
                >
                  <PlayIcon size={13} /> {lang === 'ro' ? 'Pornește live' : 'Start live'}
                </button>
              ) : (
                <button
                  type="button"
                  className="flow-btn danger"
                  onClick={() => setIsSimulating(false)}
                >
                  <StopIcon size={13} /> {lang === 'ro' ? 'Oprește live' : 'Stop live'}
                </button>
              )}

              <select
                className="flow-select-small"
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                title="Viteză simulare"
              >
                <option value={1}>1x ({lang === 'ro' ? 'Timp real' : 'Real-time'})</option>
                <option value={5}>5x ({lang === 'ro' ? 'Rapid' : 'Fast'})</option>
                <option value={10}>10x ({lang === 'ro' ? 'Accelerat' : 'Accelerated'})</option>
                <option value={30}>30x (30x)</option>
                <option value={60}>60x (60x)</option>
              </select>

              <button
                type="button"
                className="flow-btn outline"
                onClick={handleCheckWarehouse}
                title="Verificare componente magazie și marcare conform de către analistul calitate"
              >
                <PackageIcon size={14} /> {lang === 'ro' ? 'Verifică magazie & QC' : 'Check stock & QC'}
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
              {saving ? '...' : lang === 'ro' ? 'Salvează' : 'Save'}
            </button>
            <button
              type="button"
              className="flow-btn reset"
              disabled={saving}
              onClick={handleResetConfig}
              title="Resetează toți parametrii la standardul industrial din fabrică"
            >
              <RotateCcwIcon size={14} />
              {lang === 'ro' ? 'Reset fabrică' : 'Reset'}
            </button>
          </div>
        </div>
      </header>

      {/* KPI DASHBOARD BAR */}
      {stats && (
        <section className="flow-kpi-bar" aria-label="Statistici producție">
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Total PCB Marcate' : 'Total PCBs Marked'}</span>
            <span className="flow-kpi-value">{stats.qr_total || 0}</span>
            <span className="flow-kpi-sub">QR Laser 12 cifre</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Trecute prin SMD' : 'Passed SMD'}</span>
            <span className="flow-kpi-value">{stats.smd_boards_total || 0}</span>
            <span className="flow-kpi-sub">7 componente montate</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Inspecție AOI' : 'AOI Inspection'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.aoi?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.aoi?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut optic</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Test Electric ICT' : 'ICT Test'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.ict?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.ict?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut electric</span>
          </div>
          <div className="flow-kpi-card">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Test Final EOL' : 'EOL Test'}</span>
            <span className="flow-kpi-value">
              <span className="text-success">{stats.eol?.pass || 0}</span> /{' '}
              <span className="text-danger">{stats.eol?.fail || 0}</span>
            </span>
            <span className="flow-kpi-sub">Admise / Rebut funcțional</span>
          </div>
          <div className="flow-kpi-card highlight">
            <span className="flow-kpi-title">{lang === 'ro' ? 'Randament Global (Yield)' : 'Overall Yield'}</span>
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
            {lang === 'ro' ? '1. Arhitectura fluxului industrial de producție' : '1. Industrial Production Flow Architecture'}
          </h2>
          <span className="flow-section-badge">
            {lang === 'ro' ? 'Secvență cronologică' : 'Chronological Sequence'}
          </span>
        </div>

        <div className="flow-conveyor-wrapper">
          <div className="flow-conveyor-track">
            {/* Step 0: Magazie & QC */}
            <div className="flow-station-node">
              <div className="flow-node-tag">
                {lang === 'ro' ? 'Intrare' : 'Input'}
              </div>
              <div className="flow-node-icon">
                <PackageIcon size={16} />
              </div>
              <div className="flow-node-title">Magazie & QC</div>
              <div className="flow-node-desc">
                {lang === 'ro' ? 'Comenzi stoc & analist calitate' : 'Stock orders & QA sign-off'}
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
            {lang === 'ro' ? 'Configurare Generală & Serii' : 'General & Serial Config'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'defects' ? 'active' : ''}`}
            onClick={() => setActiveTab('defects')}
          >
            <AlertTriangleIcon size={14} />
            {lang === 'ro' ? 'Rate Defecte & Evenimente Aleatorii' : 'Defect Rates & Random Events'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'cycles' ? 'active' : ''}`}
            onClick={() => setActiveTab('cycles')}
          >
            <ClockIcon size={14} />
            {lang === 'ro' ? 'Timpi de Ciclu la Stații' : 'Station Cycle Times'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'buffers' ? 'active' : ''}`}
            onClick={() => setActiveTab('buffers')}
          >
            <TruckIcon size={14} />
            {lang === 'ro' ? 'Tranzit, Buffere & Suport Lot' : 'Transit, Buffers & Carrier Lot'}
          </button>
          <button
            type="button"
            className={`flow-tab-btn ${activeTab === 'warehouse' ? 'active' : ''}`}
            onClick={() => setActiveTab('warehouse')}
          >
            <PackageIcon size={14} />
            {lang === 'ro' ? 'Magazie & Analist Calitate' : 'Warehouse & QA Analyst'}
          </button>
        </div>

        {/* TAB 1: GENERAL & SERIALIZARE */}
        {activeTab === 'flow' && (
          <div className="flow-tab-pane">
            <div className="flow-grid-2">
              <div className="flow-panel-card">
                <h3 className="flow-panel-title">
                  {lang === 'ro' ? 'Formatul Numărului de Serie Industrial' : 'Industrial Serial Number Format'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Seriile pe toate plăcile trebuie să fie obligatoriu de 12 cifre: YYMMDD urmat de 6 cifre incrementabile zilnic (ex: 260902000001).'
                    : 'Serials must strictly have 12 numeric digits: YYMMDD followed by 6 incrementable digits per day (e.g. 260902000001).'}
                </p>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Mod generare prefix YYMMDD:' : 'YYMMDD prefix mode:'}
                  </label>
                  <select
                    className="flow-input-field"
                    value={config.serial_prefix_mode}
                    onChange={(e: any) => updateConfigField('serial_prefix_mode', e.target.value)}
                  >
                    <option value="current_date">
                      {lang === 'ro' ? 'Data curentă a sistemului (automat)' : 'System current date (automatic)'}
                    </option>
                    <option value="custom">
                      {lang === 'ro' ? 'Data manuală / Prefix fix de 6 cifre' : 'Manual date / 6-digit fixed prefix'}
                    </option>
                  </select>
                </div>

                {config.serial_prefix_mode === 'custom' && (
                  <div className="flow-field-group">
                    <label className="flow-field-label">
                      {lang === 'ro' ? 'Prefix manual 6 cifre (ex: 260902):' : 'Manual 6-digit prefix (e.g. 260902):'}
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
                    {lang === 'ro' ? 'Model produs PCB:' : 'PCB Product Model:'}
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
                  {lang === 'ro' ? 'Stare & Integritate Generator' : 'Generator State & Integrity'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Generatorul rulează pe un thread backend dedicat și este optimizat pentru viteză și stabilitate.'
                    : 'The generator operates on an asynchronous backend architecture designed for low-latency non-blocking responsiveness.'}
                </p>

                <div className="flow-info-box">
                  <div className="info-row">
                    <span>{lang === 'ro' ? 'Stare modul:' : 'Module state:'}</span>
                    <strong className="text-success">{config.enabled ? 'ACTIVAT' : 'DEZACTIVAT'}</strong>
                  </div>
                  <div className="info-row">
                    <span>{lang === 'ro' ? 'Stații integrate în flux:' : 'Integrated stations:'}</span>
                    <strong>QR Laser, SMD, AOI, THT, ICT, EOL (6 stații)</strong>
                  </div>
                  <div className="info-row">
                    <span>{lang === 'ro' ? 'Stație Export:' : 'Export station:'}</span>
                    <strong className="text-accent">EXCLUSĂ</strong>
                  </div>
                  <div className="info-row">
                    <span>{lang === 'ro' ? 'Format serializare:' : 'Serialization standard:'}</span>
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
                    {lang === 'ro' ? 'Defecte de SMD (Total setat: 2.0%)' : 'SMD Defects (Target total: 2.0%)'}
                  </h3>
                  <span className="flow-badge danger">Total: {totalSmdDefects}%</span>
                </div>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Componentele SMD au o probabilitate totală de defect de 2.0%, repartizată pe stațiile din aval:'
                    : 'SMD components have a 2.0% total defect probability distributed across downstream checkpoints:'}
                </p>

                {/* SMD prins la AOI */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Prinse la AOI (Inspecție optică):' : 'Caught at AOI (Optical):'}</span>
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
                    {lang === 'ro'
                      ? 'Rebutat imediat la AOI (punți cositor, componente lipsă, tombstone).'
                      : 'Fails immediately at AOI (solder bridges, missing parts, tombstoning).'}
                  </div>
                </div>

                {/* SMD prins la ICT */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Prinse la ICT (Test in-circuit):' : 'Caught at ICT (Bed-of-nails):'}</span>
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
                    {lang === 'ro'
                      ? 'Scapă de AOI și este depistat la testul electric ICT (scurtcircuit alimentare, rezonator defect).'
                      : 'Escapes AOI, detected by ICT electrical probes (shorted rails, bad oscillator).'}
                  </div>
                </div>

                {/* SMD scăpat la EOL */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Scăpate la EOL (Test final):' : 'Escaped to EOL (Final test):'}</span>
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
                    {lang === 'ro'
                      ? 'Pică la testarea finală EOL din cauza SMD (eroare protocol USB, supracurent LDO).'
                      : 'Fails at final functional test due to SMD (USB failure, LDO excessive draw).'}
                  </div>
                </div>

                <div className="flow-summary-chip success">
                  <span>{lang === 'ro' ? 'Rată conformă SMD (trec, sunt bune):' : 'SMD Pass Rate:'}</span>
                  <strong>{smdPassRate}%</strong>
                </div>
              </div>

              {/* Defecte THT & QR */}
              <div className="flow-panel-card">
                <div className="flow-card-head">
                  <h3 className="flow-panel-title">
                    {lang === 'ro' ? 'Defecte de THT (Total setat: 1.5%)' : 'THT Defects (Target total: 1.5%)'}
                  </h3>
                  <span className="flow-badge danger">Total: {totalThtDefects}%</span>
                </div>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Componentele THT (U1 ATmega328P DIP-28, headere) au o rată de defect de 1.5%:'
                    : 'THT components (U1 ATmega328P DIP-28, pin headers) have a 1.5% defect rate:'}
                </p>

                {/* THT prins la ICT */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Prinse de ICT (Bed-of-Nails):' : 'Caught at ICT:'}</span>
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
                    {lang === 'ro'
                      ? 'Lipitură rece, pin U1 nesudat sau punte pe headere prinsă la ICT.'
                      : 'Cold solder, unsoldered pin or header short caught at ICT fixture.'}
                  </div>
                </div>

                {/* THT scăpat la EOL */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Prinse de EOL (Test final):' : 'Caught at EOL:'}</span>
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
                    {lang === 'ro'
                      ? 'Conexiune THT intermitentă depistată la vibrații/carcasare EOL.'
                      : 'Intermittent THT joint failing during final boxed operation.'}
                  </div>
                </div>

                <div className="flow-summary-chip success">
                  <span>{lang === 'ro' ? 'Rată conformă THT (trec, sunt bune):' : 'THT Pass Rate:'}</span>
                  <strong>{thtPassRate}%</strong>
                </div>

                <hr className="flow-divider" />

                {/* Defect QR Laser */}
                <div className="flow-slider-field">
                  <div className="slider-label-row">
                    <span>{lang === 'ro' ? 'Rată fail marcare QR Laser:' : 'QR Laser failure rate:'}</span>
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
                    {lang === 'ro'
                      ? 'Conform specificației, la QR Laser nu ar trebui să fie failuri (0%).'
                      : 'Per specification, QR laser should have 0% failures currently.'}
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
                  {lang === 'ro'
                    ? 'Timpul în care PCB-ul stă la stația de marcare laser.'
                    : 'Duration board spends at QR laser marking station.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Timp staționare QR (secunde):' : 'QR cycle time (seconds):'}
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
                  {lang === 'ro'
                    ? 'Timpul în care piesa stă la mașina Pick & Place.'
                    : 'Time board stays at SMD Pick & Place machine.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Timp staționare SMD (secunde):' : 'SMD cycle time (seconds):'}
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
                  {lang === 'ro'
                    ? 'Scanare optică camere HD & comparare algoritmică.'
                    : 'HD optical camera scan & algorithm comparison.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Timp inspecție AOI (secunde):' : 'AOI inspection time (seconds):'}
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
                  {lang === 'ro'
                    ? 'Timp amplasare manuală soclu U1 & cositorire selectivă.'
                    : 'Manual placement of U1 socket & selective soldering.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Timp THT (secunde):' : 'THT cycle time (seconds):'}
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
                  {lang === 'ro'
                    ? 'Coborâre pat de ace (bed-of-nails) & măsurători voltaj/rezistențe.'
                    : 'Bed-of-nails fixture engagement & voltage/component tests.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Durată test ICT (secunde):' : 'ICT test duration (seconds):'}
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
                  {lang === 'ro'
                    ? 'Test funcțional complet în carcasă cu simulare periferice.'
                    : 'Complete functional test in casing with simulated peripherals.'}
                </p>
                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Durată test EOL (secunde):' : 'EOL test duration (seconds):'}
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
                    {lang === 'ro' ? 'Suport Lot AOI ➔ THT (40 - 60 piese)' : 'Carrier Lot AOI ➔ THT (40 - 60 pcs)'}
                  </h3>
                  <span className="flow-badge primary">Transfer în bloc</span>
                </div>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Regulă critică de producție: Plăcile nu trec una câte una la THT, ci se acumulează pe tăvi suport de câte 40-60 piese și trec toate odată când tava este completă.'
                    : 'Critical rule: Boards do not transfer one by one to THT; they accumulate on carriers of 40-60 pcs and move together once carrier is full.'}
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
                  {lang === 'ro' ? 'Tranzit QR ➔ SMD & Pauze Producție' : 'QR ➔ SMD Transit & Pauses'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Tranzit standard de 30 secunde cu perioade aleatorii de pauză între 1 și 10 minute.'
                    : 'Standard 30s transit with random production pause intervals between 1 and 10 minutes.'}
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
                  {lang === 'ro' ? 'Tranzit SMD ➔ AOI (25 - 50 secunde)' : 'SMD ➔ AOI Transit (25 - 50s)'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Interval între cuptorul de reflow SMD și stația AOI cu pauze rare de minute.'
                    : 'Transit between reflow oven and AOI with rare minute-long pauses.'}
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
                  {lang === 'ro' ? 'Tranzit THT ➔ ICT & Carcasare ➔ EOL' : 'THT ➔ ICT & Casing ➔ EOL'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'THT spre ICT durează 30-40 secunde; după ICT, carcasarea și deplasarea spre EOL sunt aleatorii.'
                    : 'THT to ICT lasts 30-40s; casing and transit to EOL are randomized.'}
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
                  {lang === 'ro' ? 'Comenzi Automate din Magazie' : 'Automated Warehouse Orders'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Când generatorul pornește sau stocul scade sub 50 de bucăți, plasează automat comenzi de reaprovizionare în baza de date a magaziei.'
                    : 'When stock drops below 50 pcs, automatically orders replenishment batches in inventory table.'}
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
                      {lang === 'ro'
                        ? 'Activează comanda automată la stoc redus'
                        : 'Enable auto replenishment orders'}
                    </span>
                  </label>
                </div>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Cantitate comandată per lot (bucăți):' : 'Batch order quantity (pcs):'}
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
                  {lang === 'ro' ? 'Verificare Automată Analist Calitate' : 'Automated QA Analyst Verification'}
                </h3>
                <p className="flow-panel-desc">
                  {lang === 'ro'
                    ? 'Fiecare lot sosit în recepție este inspectat și marcat automat ca fiind CONFORM și semnat de către analistul calitate.'
                    : 'Incoming shipments are automatically verified, approved CONFORM and signed by the QA analyst.'}
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
                      {lang === 'ro'
                        ? 'Semnare automată de către Analist Calitate'
                        : 'Automatic sign-off by Quality Analyst'}
                    </span>
                  </label>
                </div>

                <div className="flow-field-group">
                  <label className="flow-field-label">
                    {lang === 'ro' ? 'Utilizator Analist Calitate:' : 'Quality Analyst Username:'}
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
                    {lang === 'ro' ? 'Decizie recepție lot:' : 'Incoming batch verdict:'}
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
              {lang === 'ro' ? 'Jurnal de Evenimente & Trasabilitate Live' : 'Live Traceability & Event Log'}
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
              {lang === 'ro' ? 'Șterge jurnal' : 'Clear log'}
            </button>
          </div>
        </div>

        <div className="flow-console-body" ref={logContainerRef}>
          {eventLogs.length === 0 ? (
            <div className="console-empty">
              {lang === 'ro'
                ? 'Jurnalul este gol. Apăsați pe „Lansează lot” sau porniți simularea live pentru a vizualiza deplasarea pieselor.'
                : 'Log is empty. Click "Run batch" or start live simulation to monitor PCB movement.'}
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
