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

const X = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const Edit = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const Trash = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const Search = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const Clock = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const Phone = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ChevronRight = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Eye = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Filter = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== КОМПОНЕНТ: ВЫБОР ФИЛИАЛА ====================
const BranchSelector = ({ onBranchSelect }) => {
  const [branches, setBranches] = React.useState([]);
  const [password, setPassword] = React.useState('');
  const [selectedBranch, setSelectedBranch] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiRequest('/branches');
        
        // API возвращает: {"branches": ["Станкевича", "Центральный", ...]}
        // Преобразуем в массив объектов
        if (data && data.branches && Array.isArray(data.branches)) {
          const branchList = data.branches.map((name, index) => ({
            id: index + 1,
            name: name,
            address: `Филиал ${name}`
          }));
          setBranches(branchList);
        } else {
          throw new Error('Неверный формат данных от сервера');
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
        setError('Не удалось загрузить список филиалов. Проверьте подключение к серверу.');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleLogin = async () => {
    if (!selectedBranch) {
      setError('Выберите филиал');
      return;
    }
    
    if (!password) {
      setError('Введите пароль');
      return;
    }

    try {
      setError(null);
      
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          branch_id: selectedBranch.id,
          password: password,
        }),
      });

      // Успешный вход
      if (data && data.token) {
        onBranchSelect(selectedBranch, data.token);
      } else {
        throw new Error('Неверный ответ сервера');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Неверный пароль или ошибка сервера');
      setPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-slate-600">Загрузка филиалов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">BarberCRM</h1>
          <p className="text-slate-600">Выберите филиал для входа</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Филиал
            </label>
            {branches.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Нет доступных филиалов
              </div>
            ) : (
              <div className="grid gap-3">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedBranch?.id === branch.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-800">{branch.name}</div>
                    <div className="text-sm text-slate-600">{branch.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите пароль"
              disabled={!selectedBranch}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedBranch || !password}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
              selectedBranch && password
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Войти
          </button>
        </div>
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
            onClick={onLogout}
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
            <p className="text-slate-600 mt-2">Филиал: {branch.name}</p>
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

  const handleBranchSelect = (selectedBranch, authToken) => {
    console.log('Login successful:', selectedBranch);
    setBranch(selectedBranch);
    setToken(authToken);
  };

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      setBranch(null);
      setToken(null);
    }
  };

  if (!branch || !token) {
    return <BranchSelector onBranchSelect={handleBranchSelect} />;
  }

  return <BarberCRM branch={branch} token={token} onLogout={handleLogout} />;
};

// ==================== РЕНДЕРИНГ ====================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
