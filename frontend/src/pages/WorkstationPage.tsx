import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import type { Language, User } from '../types';
import { WORKSTATIONS } from '../i18n';
import PortalNavbar from '../components/PortalNavbar';
import RestrictedAccess from '../components/RestrictedAccess';
import OperatorBarcodeModal from '../components/OperatorBarcodeModal';
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
import PlmPage from './PlmPage';

const OPERATOR_GATED_STATIONS = ['qr-laser', 'smd', 'aoi', 'tht', 'ict', 'eol', 'export'];

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

  // Set de posturi pentru care operatorul a validat deja codul de bare în această sesiune
  const [unlockedStations, setUnlockedStations] = useState<Set<string>>(new Set());

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

  // Verificare dacă utilizatorul are rol de operator și dacă postul necesită validare de legitimație (cod de bare)
  const isOperator = currentUser.role === 'operator' || currentUser.role === 'production';
  const requiresBarcodeGate =
    isOperator &&
    OPERATOR_GATED_STATIONS.includes(currentWs.id) &&
    !unlockedStations.has(currentWs.id);

  const handleStationUnlocked = () => {
    setUnlockedStations((prev) => new Set(prev).add(currentWs.id));
  };

  const handleCancelBarcodeGate = () => {
    // În caz de anulare a validării legitimației, revenire la ecranul de autentificare
    onLogout();
  };

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
      ) : requiresBarcodeGate ? (
        <OperatorBarcodeModal
          lang={lang}
          currentUser={currentUser}
          currentWs={currentWs}
          onAuthorized={handleStationUnlocked}
          onCancel={handleCancelBarcodeGate}
        />
      ) : (
        /* Randare pagina dedicată pentru fiecare post de lucru */
        (() => {
          switch (currentWs.id) {
            case 'magazie':
              return <MagaziePage lang={lang} currentUser={currentUser} />;
            case 'receptie-marfa':
              return <ReceptieMarfaPage lang={lang} />;
            case 'qr-laser':
              return <QrLaserPage lang={lang} currentUser={currentUser} />;
            case 'smd':
              return <SmdPage lang={lang} currentUser={currentUser} />;
            case 'aoi':
              return <AoiPage lang={lang} currentUser={currentUser} />;
            case 'tht':
              return <ThtPage lang={lang} currentUser={currentUser} />;
            case 'ict':
              return <IctPage lang={lang} currentUser={currentUser} />;
            case 'eol':
              return <EolPage lang={lang} currentUser={currentUser} />;
            case 'export':
              return <ExportPage lang={lang} />;
            case 'statistica':
              return <StatisticaPage lang={lang} />;
            case 'plm':
              return <PlmPage lang={lang} />;
            default:
              return <main className="blank-page-white"></main>;
          }
        })()
      )}
    </div>
  );
}

export default WorkstationPage;
