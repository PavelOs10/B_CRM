import React from 'react';
import ReactDOM from 'react-dom/client';

// ==================== ИКОНКИ ====================
const Plus = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const Menu = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const X = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const Calendar = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const Users = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DollarSign = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const BarChart = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);

const Settings = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const AlertCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const CheckCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const LogIn = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

const UserPlus = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

// ==================== КОНФИГУРАЦИЯ ====================
const API_BASE_URL = 'http://166.1.201.124:8000';

// ==================== API УТИЛИТЫ ====================
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== КОМПОНЕНТ: АВТОРИЗАЦИЯ/РЕГИСТРАЦИЯ ====================
const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = React.useState('login'); // 'login' или 'register'
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  
  // Поля для входа
  const [loginName, setLoginName] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  
  // Поля для регистрации
  const [regName, setRegName] = React.useState('');
  const [regAddress, setRegAddress] = React.useState('');
  const [regManager, setRegManager] = React.useState('');
  const [regPhone, setRegPhone] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = React.useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!loginName.trim()) {
      setError('Введите название филиала');
      return;
    }
    
    if (!loginPassword) {
      setError('Введите пароль');
      return;
    }

    try {
      setLoading(true);
      
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          name: loginName.trim(),
          password: loginPassword,
        }),
      });

      if (data.success && data.token) {
        onAuth(data.branch, data.token);
      } else {
        throw new Error('Неверный ответ сервера');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
      setLoginPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Валидация
    if (!regName.trim() || !regAddress.trim() || !regManager.trim() || !regPhone.trim() || !regPassword) {
      setError('Заполните все поля');
      return;
    }
    
    if (regPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }
    
    if (regPassword !== regPasswordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          address: regAddress.trim(),
          manager_name: regManager.trim(),
          manager_phone: regPhone.trim(),
          password: regPassword,
        }),
      });

      if (data.success) {
        setSuccess('Филиал успешно зарегистрирован! Теперь можете войти.');
        
        // Очищаем поля
        setRegName('');
        setRegAddress('');
        setRegManager('');
        setRegPhone('');
        setRegPassword('');
        setRegPasswordConfirm('');
        
        // Переключаем на вход через 2 секунды
        setTimeout(() => {
          setMode('login');
          setLoginName(data.branch.name);
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">BarberCRM</h1>
          <p className="text-slate-600">
            {mode === 'login' ? 'Вход в систему' : 'Регистрация филиала'}
          </p>
        </div>

        {/* Переключатель режимов */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            Вход
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Регистрация
          </button>
        </div>

        {/* Сообщения */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Форма входа */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Название филиала
              </label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => {
                  setLoginName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Станкевича"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите пароль"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !loginName.trim() || !loginPassword}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                loading || !loginName.trim() || !loginPassword
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        )}

        {/* Форма регистрации */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Название филиала *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => {
                  setRegName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Станкевича"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Адрес *
              </label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => {
                  setRegAddress(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Улица, дом"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Имя управляющего *
              </label>
              <input
                type="text"
                value={regManager}
                onChange={(e) => {
                  setRegManager(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ФИО управляющего"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Телефон *
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => {
                  setRegPhone(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+7 (___) ___-__-__"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Пароль * (минимум 6 символов)
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => {
                  setRegPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Придумайте пароль"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Повторите пароль *
              </label>
              <input
                type="password"
                value={regPasswordConfirm}
                onChange={(e) => {
                  setRegPasswordConfirm(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Повторите пароль"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                loading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? 'Регистрация...' : 'Зарегистрировать филиал'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ==================== КОМПОНЕНТ: ГЛАВНЫЙ CRM ====================
const BarberCRM = ({ branch, token, onLogout }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: BarChart },
    { id: 'appointments', label: 'Записи', icon: Calendar },
    { id: 'clients', label: 'Клиенты', icon: Users },
    { id: 'revenue', label: 'Выручка', icon: DollarSign },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          <h2 className={`font-bold text-xl transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            BarberCRM
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title={sidebarOpen ? 'Свернуть меню' : 'Развернуть меню'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 mb-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className={`text-sm text-slate-400 mb-1 ${!sidebarOpen && 'hidden'}`}>Филиал</div>
            <div className={`font-semibold ${!sidebarOpen && 'text-xs text-center'}`}>
              {sidebarOpen ? branch.name : branch.name.substring(0, 2).toUpperCase()}
            </div>
            {sidebarOpen && branch.address && (
              <div className="text-xs text-slate-400 mt-1">{branch.address}</div>
            )}
          </div>
        </div>

        <nav className="px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium ${!sidebarOpen && 'hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Кнопка выхода */}
        <div className="absolute bottom-6 left-0 right-0 px-3">
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите выйти?')) {
                onLogout();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-red-600 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5 flex-shrink-0" />
            <span className={`font-medium ${!sidebarOpen && 'hidden'}`}>
              Выход
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              {menuItems.find((item) => item.id === currentView)?.label || 'Дашборд'}
            </h1>
            <p className="text-slate-600 mt-2">
              Филиал: {branch.name}
              {branch.manager && ` • Управляющий: ${branch.manager}`}
            </p>
          </div>

          {/* Контент разделов */}
          <div className="space-y-6">
            {currentView === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Записей сегодня</h3>
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">24</p>
                  <p className="text-sm text-green-600 mt-2">+12% от вчера</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Всего клиентов</h3>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">1,248</p>
                  <p className="text-sm text-green-600 mt-2">+5 новых</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Выручка сегодня</h3>
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">₽12,450</p>
                  <p className="text-sm text-green-600 mt-2">+8% от вчера</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Средний чек</h3>
                    <BarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">₽1,850</p>
                  <p className="text-sm text-slate-600 mt-2">За месяц</p>
                </div>
              </div>
            )}

            {currentView !== 'dashboard' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-slate-600">
                  Раздел "{menuItems.find((item) => item.id === currentView)?.label}" в разработке
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ГЛАВНОЕ ПРИЛОЖЕНИЕ ====================
const App = () => {
  const [branch, setBranch] = React.useState(null);
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    // Восстановление сессии из localStorage
    const savedBranch = localStorage.getItem('barber_branch');
    const savedToken = localStorage.getItem('barber_token');
    
    if (savedBranch && savedToken) {
      try {
        setBranch(JSON.parse(savedBranch));
        setToken(savedToken);
      } catch (e) {
        console.error('Error restoring session:', e);
        localStorage.removeItem('barber_branch');
        localStorage.removeItem('barber_token');
      }
    }
  }, []);

  const handleAuth = (branchData, authToken) => {
    setBranch(branchData);
    setToken(authToken);
    
    // Сохраняем сессию
    localStorage.setItem('barber_branch', JSON.stringify(branchData));
    localStorage.setItem('barber_token', authToken);
  };

  const handleLogout = () => {
    setBranch(null);
    setToken(null);
    localStorage.removeItem('barber_branch');
    localStorage.removeItem('barber_token');
  };

  if (!branch || !token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <BarberCRM branch={branch} token={token} onLogout={handleLogout} />;
};

// ==================== РЕНДЕРИНГ ====================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
