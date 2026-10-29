import { useParams, Navigate } from 'react-router-dom';
import type { Language, User } from '../types';
import { WORKSTATIONS } from '../i18n';
import PortalNavbar from '../components/PortalNavbar';
import RestrictedAccess from '../components/RestrictedAccess';
import MagaziePage from './MagaziePage';
import ReceptieMarfaPage from './ReceptieMarfaPage';
import QrLaserPage from './QrLaserPage';
import SmdPage from './SmdPage';
import AoiPage from './AoiPage';
import ThtPage from './ThtPage';
import IctPage from './IctPage';
import EolPage from './EolPage';
import ExportPage from './ExportPage';
import StatisticaPage from './StatisticaPage';

interface WorkstationPageProps {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export function WorkstationPage({
  lang,
  onLangChange,
  currentUser,
  onLogout,
}: WorkstationPageProps) {
  const { stationId } = useParams<{ stationId?: string; subPageId?: string }>();

  // Verificare dacă utilizatorul este autentificat; dacă nu, redirecționare la login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const effectiveStationId = stationId || 'statistica';
  const currentWs = WORKSTATIONS.find((w) => w.id === effectiveStationId);

  // Dacă postul nu este valid, redirecționare la login
  if (!currentWs) {
    return <Navigate to="/" replace />;
  }

  const hasAccess = currentWs.allowedRoles.includes(currentUser.role);

  return (
    <div className="station-page-layout">
      {/* Top Navbar comun pentru toate posturile */}
      <PortalNavbar
        lang={lang}
        onLangChange={onLangChange}
        currentWs={currentWs}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Verificare acces pe bază de rol */}
      {!hasAccess ? (
        <RestrictedAccess lang={lang} onLogout={onLogout} />
      ) : (
        /* Randare pagina dedicată pentru fiecare post de lucru */
        (() => {
          switch (currentWs.id) {
            case 'magazie':
              return <MagaziePage lang={lang} />;
            case 'receptie-marfa':
              return <ReceptieMarfaPage lang={lang} />;
            case 'qr-laser':
              return <QrLaserPage lang={lang} />;
            case 'smd':
              return <SmdPage lang={lang} />;
            case 'aoi':
              return <AoiPage lang={lang} />;
            case 'tht':
              return <ThtPage lang={lang} />;
            case 'ict':
              return <IctPage lang={lang} />;
            case 'eol':
              return <EolPage lang={lang} />;
            case 'export':
              return <ExportPage lang={lang} />;
            case 'statistica':
              return <StatisticaPage lang={lang} />;
            default:
              return <main className="blank-page-white"></main>;
          }
        })()
      )}
    </div>
  );
}

export default WorkstationPage;
