import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import type { Language, User } from './types';
import LoginPage from './pages/LoginPage';
import WorkstationPage from './pages/WorkstationPage';
import './App.css';

function AppRoutes({
  lang,
  onLangChange,
  currentUser,
  onLoginSuccess,
  onLogout,
}: {
  lang: Language;
  onLangChange: (newLang: Language) => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, stationId: string, navigate: (path: string) => void) => void;
  onLogout: (navigate: (path: string) => void) => void;
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginPage
            lang={lang}
            onLangChange={onLangChange}
            onLoginSuccess={(user, stationId) => onLoginSuccess(user, stationId, navigate)}
          />
        }
      />

      <Route
        path="/statistica/:subPageId"
        element={
          <WorkstationPage
            lang={lang}
            onLangChange={onLangChange}
            currentUser={currentUser}
            onLogout={() => onLogout(navigate)}
          />
        }
      />

      <Route
        path="/:stationId"
        element={
          <WorkstationPage
            lang={lang}
            onLangChange={onLangChange}
            currentUser={currentUser}
            onLogout={() => onLogout(navigate)}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('smartqma_lang');
      return savedLang === 'en' ? 'en' : 'ro';
    } catch {
      return 'ro';
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('smartqma_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('smartqma_lang', newLang);
    } catch {
      // ignore
    }
  };

  const handleLoginSuccess = (
    user: User,
    stationId: string,
    navigate: (path: string) => void
  ) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('smartqma_user', JSON.stringify(user));
      localStorage.setItem('smartqma_station', stationId);
    } catch {
      // ignore
    }

    if (stationId === 'statistica') {
      navigate('/statistica/pagina-1');
    } else {
      navigate(`/${stationId}`);
    }
  };

  const handleLogout = (navigate: (path: string) => void) => {
    try {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      }).catch(() => {
        // ignore
      });
    } catch {
      // ignore
    }

    setCurrentUser(null);
    try {
      localStorage.removeItem('smartqma_user');
      localStorage.removeItem('smartqma_station');
    } catch {
      // ignore
    }
    navigate('/');
  };

  return (
    <BrowserRouter>
      <AppRoutes
        lang={lang}
        onLangChange={handleLangChange}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

export default App;
