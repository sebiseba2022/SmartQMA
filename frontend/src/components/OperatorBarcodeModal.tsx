import { useState, useRef, useEffect, type FormEvent } from 'react';
import type { Language, User } from '../types';
import type { WorkstationDef } from '../i18n';

interface OperatorBarcodeModalProps {
  lang: Language;
  currentUser: User;
  currentWs: WorkstationDef;
  onAuthorized: () => void;
  onCancel: () => void;
}

export function OperatorBarcodeModal({
  lang,
  currentUser,
  currentWs,
  onAuthorized,
  onCancel,
}: OperatorBarcodeModalProps) {
  const [barcode, setBarcode] = useState(currentUser.barcode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async (barcodeToVerify: string) => {
    const code = barcodeToVerify.trim();
    if (!code) {
      setError(
        lang === 'ro'
          ? 'Vă rugăm să scanați sau introduceți codul de bare.'
          : 'Please scan or enter your barcode.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/verify-station-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          station_id: currentWs.id,
          barcode: code,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.authorized) {
        throw new Error(
          json.message ||
            (lang === 'ro'
              ? 'Acces neautorizat pentru acest post.'
              : 'Unauthorized access for this workstation.')
        );
      }

      onAuthorized();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Eroare la verificarea codului de bare.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleVerify(barcode);
  };

  const handleQuickFill = (code: string) => {
    setBarcode(code);
    handleVerify(code);
  };

  return (
    <div className="magazie-modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="magazie-modal-card operator-barcode-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="magazie-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="station-code-pill" style={{ margin: 0 }}>
              {currentWs.code}
            </span>
            <h2 className="magazie-modal-title" style={{ margin: 0, fontSize: '17px' }}>
              {lang === 'ro' ? 'Verificare acces operator' : 'Operator access verification'}
            </h2>
          </div>
          <button
            type="button"
            className="magazie-modal-close"
            onClick={onCancel}
            aria-label="Închide"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px', lineHeight: '1.5' }}>
            {lang === 'ro'
              ? `Postul de lucru «${currentWs.name.ro}» necesită validarea legitimației de operator.`
              : `Workstation "${currentWs.name.en}" requires operator badge validation.`}
          </p>

          {error && <div className="magazie-standard-error">{error}</div>}

          <form onSubmit={handleSubmit} className="magazie-modal-form" style={{ marginTop: '8px' }}>
            <div className="magazie-form-field" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="operator-barcode-input">
                {lang === 'ro' ? 'Cod de bare operator (scanat / introdus)' : 'Operator barcode'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="operator-barcode-input"
                  ref={inputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ex: BC-OP-SMD-001"
                  disabled={loading}
                  autoComplete="off"
                  style={{
                    paddingLeft: '38px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#64748b',
                  marginBottom: '6px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'ro' ? 'Legitimații de test:' : 'Test operator badges:'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className="quick-fill-pill"
                  onClick={() => handleQuickFill('BC-OP-SMD-001')}
                  disabled={loading}
                >
                  SMD (BC-OP-SMD-001)
                </button>
                <button
                  type="button"
                  className="quick-fill-pill"
                  onClick={() => handleQuickFill('BC-OP-AOI-002')}
                  disabled={loading}
                >
                  AOI (BC-OP-AOI-002)
                </button>
                <button
                  type="button"
                  className="quick-fill-pill"
                  onClick={() => handleQuickFill('BC-OP-GEN-003')}
                  disabled={loading}
                >
                  General (BC-OP-GEN-003)
                </button>
              </div>
            </div>

            <div className="magazie-modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="magazie-btn-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                {lang === 'ro' ? 'Anulează' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="magazie-btn-submit"
                disabled={loading || !barcode.trim()}
              >
                {loading
                  ? lang === 'ro'
                    ? 'Se verifică...'
                    : 'Verifying...'
                  : lang === 'ro'
                    ? 'Verifică accesul'
                    : 'Verify access'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OperatorBarcodeModal;

