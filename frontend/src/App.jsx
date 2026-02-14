const { useState } = React;
import api from './api/index.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { MainLayout } from './components/MainLayout.jsx';
import { Toast } from './components/UI.jsx';

const App = () => {
  const [branch, setBranch] = useState(null);
  const [token, setToken] = useState(null);
  const [toast, setToast] = useState(null);

  const handleAuth = (branchData, authToken) => {
    setBranch(branchData);
    setToken(authToken);
    localStorage.setItem('branch', JSON.stringify(branchData));
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setBranch(null);
    setToken(null);
    localStorage.removeItem('branch');
    localStorage.removeItem('token');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Автовосстановление сессии
  React.useEffect(() => {
    const savedBranch = localStorage.getItem('branch');
    const savedToken = localStorage.getItem('token');
    if (savedBranch && savedToken) {
      setBranch(JSON.parse(savedBranch));
      setToken(savedToken);
    }
  }, []);

  if (!branch || !token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <>
      <MainLayout branch={branch} onLogout={handleLogout} showToast={showToast} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
