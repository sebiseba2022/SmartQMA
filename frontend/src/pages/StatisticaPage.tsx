import { useParams, useNavigate } from 'react-router-dom';
import type { Language, User } from '../types';
import { STATS_MODEL_PAGES, translations } from '../i18n';
import FlowGeneratorView from '../components/FlowGeneratorView';

interface StatisticaPageProps {
  lang?: Language;
  currentUser?: User | null;
}

export function StatisticaPage({ currentUser }: StatisticaPageProps) {
  const { subPageId } = useParams<{ subPageId?: string }>();
  const navigate = useNavigate();
  const t = translations.ro;

  const validSubPage = STATS_MODEL_PAGES.find((p) => p.id === subPageId);
  const activeStatsPageId = validSubPage ? validSubPage.id : STATS_MODEL_PAGES[0].id;
  const currentSubPageName = validSubPage ? validSubPage.name.ro : STATS_MODEL_PAGES[0].name.ro;

  return (
    <div className="stats-workspace-layout">
      {/* Meniu lateral stânga - Elegat, temă Bordeaux / Deep Wine */}
      <aside className="stats-sidebar" aria-label={t.statsMenuTitle}>
        <div className="stats-sidebar-header">
          <span className="stats-sidebar-brand-dot" />
          <span>{t.statsMenuTitle}</span>
        </div>
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
                <span className="stats-nav-text">{page.name.ro}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Spațiu de lucru pentru pagina selectată - Temă luminoasă, aerisită */}
      <main className="stats-main-content">
        {activeStatsPageId === 'pagina-6' ? (
          <FlowGeneratorView currentUser={currentUser} />
        ) : (
          <>
            <div className="stats-content-header">
              <h2 className="stats-content-title">{currentSubPageName}</h2>
              <span className="stats-content-subtitle">
                Modul de analiză și rapoarte de producție
              </span>
            </div>
            <div className="stats-content-body blank-page-white">
              <div className="stats-empty-state">
                <div className="stats-empty-icon" />
                <p className="stats-empty-text">
                  {t.workspaceDescPrefix} «{currentSubPageName}». {t.workspaceDescSuffix}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default StatisticaPage;
