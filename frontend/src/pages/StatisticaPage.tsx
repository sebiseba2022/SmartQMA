import { useParams, useNavigate } from 'react-router-dom';
import type { Language } from '../types';
import { STATS_MODEL_PAGES, translations } from '../i18n';

interface StatisticaPageProps {
  lang: Language;
}

export function StatisticaPage({ lang }: StatisticaPageProps) {
  const { subPageId } = useParams<{ subPageId?: string }>();
  const navigate = useNavigate();
  const t = translations[lang];

  const validSubPage = STATS_MODEL_PAGES.find((p) => p.id === subPageId);
  const activeStatsPageId = validSubPage ? validSubPage.id : STATS_MODEL_PAGES[0].id;
  const currentSubPageName = validSubPage ? validSubPage.name[lang] : STATS_MODEL_PAGES[0].name[lang];

  return (
    <div className="stats-workspace-layout">
      {/* Meniu lateral stânga */}
      <aside className="stats-sidebar" aria-label={t.statsMenuTitle}>
        <div className="stats-sidebar-header">{t.statsMenuTitle}</div>
        <nav className="stats-sidebar-nav">
          {STATS_MODEL_PAGES.map((page) => {
            const isActive = activeStatsPageId === page.id;
            return (
              <button
                key={page.id}
                type="button"
                className={`stats-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(`/statistica/${page.id}`)}
              >
                <span className="stats-nav-dot" />
                <span className="stats-nav-text">{page.name[lang]}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Spațiu de lucru pentru pagina selectată */}
      <main className="stats-main-content">
        <div className="stats-content-header">
          <h2 className="stats-content-title">{currentSubPageName}</h2>
          <span className="stats-content-subtitle">
            {lang === 'ro'
              ? 'Modul de analiză și rapoarte de producție'
              : 'Production analytics and yield reports module'}
          </span>
        </div>
        <div className="stats-content-body blank-page-white">
          {/* Zona curată pregătită pentru grafice și indicatori de performanță */}
        </div>
      </main>
    </div>
  );
}

export default StatisticaPage;
