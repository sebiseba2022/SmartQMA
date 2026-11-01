import type { Language } from '../types';

interface LiveStreamFreezeBannerProps {
  pendingCount: number;
  onResume: () => void;
  lang?: Language;
}

export function LiveStreamFreezeBanner({
  pendingCount,
  onResume,
}: LiveStreamFreezeBannerProps) {
  if (pendingCount <= 0) return null;

  return (
    <div
      className="live-stream-freeze-banner"
      onClick={onResume}
      role="button"
      tabIndex={0}
      title="Apasă pentru a derula la ultimele rezultate live"
    >
      <span className="live-stream-pulse-dot" />
      <span className="live-stream-banner-text">
        {pendingCount} înregistrări noi în flux — Vizualizarea este fixată pe linia curentă
      </span>
      <button type="button" className="live-stream-resume-pill" onClick={onResume}>
        Derulează la ultimele rezultate ↑
      </button>
    </div>
  );
}

export default LiveStreamFreezeBanner;
