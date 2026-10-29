import type { Language } from '../types';

interface LiveStreamFreezeBannerProps {
  pendingCount: number;
  onResume: () => void;
  lang: Language;
}

export function LiveStreamFreezeBanner({
  pendingCount,
  onResume,
  lang,
}: LiveStreamFreezeBannerProps) {
  if (pendingCount <= 0) return null;

  return (
    <div
      className="live-stream-freeze-banner"
      onClick={onResume}
      role="button"
      tabIndex={0}
      title={lang === 'ro' ? 'Apasă pentru a derula la ultimele rezultate live' : 'Click to jump to latest live results'}
    >
      <span className="live-stream-pulse-dot" />
      <span className="live-stream-banner-text">
        {lang === 'ro'
          ? `${pendingCount} înregistrări noi în flux — Vizualizarea este fixată pe linia curentă`
          : `${pendingCount} new stream records — View is locked on current row`}
      </span>
      <button type="button" className="live-stream-resume-pill" onClick={onResume}>
        {lang === 'ro' ? 'Derulează la ultimele rezultate ↑' : 'Jump to latest results ↑'}
      </button>
    </div>
  );
}

export default LiveStreamFreezeBanner;
