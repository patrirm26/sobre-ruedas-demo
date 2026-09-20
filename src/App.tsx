import { useEffect } from 'react';
import { useKoraStore } from './state/store';
import { selectActiveUser } from './state/selectors';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ViewRouter } from './components/ViewRouter';
import { BottomNav } from './components/BottomNav';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';
import { AuthScreen } from './features/auth/AuthScreen';
import { DemoBanner } from './sandbox/DemoBanner';
import { SimulationPanel } from './sandbox/SimulationPanel';
import { CopilotFab } from './features/copilot/CopilotFab';
import { BackOfficeApp } from './backoffice/BackOfficeApp';
import { useSyncBcvRate } from './lib/useSyncBcvRate';
import { useRestoreSession } from './lib/useRestoreSession';

function App() {
  const theme = useKoraStore((s) => s.theme);
  const loggedIn = useKoraStore((s) => s.loggedIn);
  const activeUser = useKoraStore(selectActiveUser);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
  }, [theme]);

  useSyncBcvRate();
  useRestoreSession();

  if (!loggedIn) {
    return <AuthScreen />;
  }

  if (activeUser?.accountType === 'operador') {
    return <BackOfficeApp />;
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <DemoBanner />
        <Topbar />
        <ViewRouter />
      </div>
      <BottomNav />
      <Modal />
      <Toast />
      <SimulationPanel />
      <CopilotFab />
    </div>
  );
}

export default App;
