// ==================== BARBER CRM v3.0.1 FINAL ====================
// ПОЛНАЯ ВЕРСИЯ СО ВСЕМИ ФОРМАМИ
// ИСПРАВЛЕНИЯ: автоматический расчет недели, все формы работают

const { useState, useEffect, useRef } = React;

// ==================== CONFIG ====================
const API_BASE_URL = 'http://166.1.201.124:8000';

// ==================== API ====================
const api = {
  async request(endpoint, options = {}) {
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
  }
};

// ==================== UTILS ====================

// Автоматический расчет недели года
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

// ==================== ICONS ====================
const Icons = {
  Plus: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  ),
  Calendar: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  Users: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Chart: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  Star: ({className, filled}) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
  ),
  Check: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
  ),
  X: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  ),
  Menu: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
  ),
  Eye: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  )
};

// ==================== COMPONENTS ====================

const StarRating = ({ value, onChange, max = 10, size = "md" }) => {
  const [hovered, setHovered] = useState(null);
  const sizeClasses = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" };
  
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(null)}
          className="transition-transform hover:scale-110"
        >
          <Icons.Star 
            className={`${sizeClasses[size]} ${
              (hovered !== null ? i < hovered : i < value) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            filled={(hovered !== null ? i < hovered : i < value)}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700 self-center">{hovered || value}/10</span>
    </div>
  );
};

const FormInput = ({ label, tooltip, required, error, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && <span className="ml-2 text-gray-400 text-xs">ℹ️ {tooltip}</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in z-50`}>
      {type === 'success' && <Icons.Check className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded">
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ==================== AUTH ====================

const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regManager, setRegManager] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      const data = await api.request('/login', {
        method: 'POST',
        body: JSON.stringify({ name: loginName.trim(), password: loginPassword }),
      });

      if (data.success) {
        onAuth(data.branch, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      const data = await api.request('/register', {
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
        setMode('login');
        setLoginName(regName);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            BarberCRM
          </h1>
          <p className="text-gray-600">v3.0.1 FINAL - Полная версия</p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => {setMode('login'); setError(null);}}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'login' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => {setMode('register'); setError(null);}}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'register' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
            }`}
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <FormInput label="Название филиала" required>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Станкевича"
              />
            </FormInput>

            <FormInput label="Пароль" required>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormInput>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <FormInput label="Название филиала" required>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormInput>
            <FormInput label="Адрес" required>
              <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormInput>
            <FormInput label="Имя управляющего" required>
              <input type="text" value={regManager} onChange={(e) => setRegManager(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormInput>
            <FormInput label="Телефон" required>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormInput>
            <FormInput label="Пароль (минимум 6 символов)" required>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormInput>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Регистрация...' : 'Зарегистрировать'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN CRM ====================

const BarberCRM = ({ branch, token, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: Icons.Chart },
    { id: 'morning-events', label: 'Утренние мероприятия', icon: Icons.Calendar },
    { id: 'field-visits', label: 'Полевые выходы', icon: Icons.Users },
    { id: 'one-on-one', label: 'One-on-One', icon: Icons.Users },
    { id: 'weekly-metrics', label: 'Еженедельные показатели', icon: Icons.Chart },
    { id: 'newbie-adaptation', label: 'Адаптация новичков', icon: Icons.Users },
    { id: 'master-plans', label: 'Планы мастеров', icon: Icons.Chart },
    { id: 'reviews', label: 'Отзывы', icon: Icons.Star },
    { id: 'branch-summary', label: 'Сводка', icon: Icons.Chart },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && <h2 className="font-bold text-xl">BarberCRM</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg">
            <Icons.Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 my-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            {sidebarOpen ? (
              <>
                <div className="text-xs text-gray-400 mb-1">Филиал</div>
                <div className="font-semibold">{branch.name}</div>
                {branch.manager && <div className="text-sm text-gray-400 mt-1">{branch.manager}</div>}
              </>
            ) : (
              <div className="text-xs text-center font-semibold">{branch.name.substring(0, 2)}</div>
            )}
          </div>
        </div>

        <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 text-gray-300 hover:text-white transition-all">
            <Icons.X className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Выход</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {menuItems.find((item) => item.id === currentView)?.label || 'Дашборд'}
            </h1>
            <p className="text-gray-600 mt-2">Филиал: {branch.name} • Управляющий: {branch.manager}</p>
          </div>

          {currentView === 'dashboard' && <Dashboard branch={branch} />}
          {currentView === 'morning-events' && <MorningEventsPage branch={branch} showToast={showToast} />}
          {currentView === 'field-visits' && <FieldVisitsPage branch={branch} showToast={showToast} />}
          {currentView === 'one-on-one' && <OneOnOnePage branch={branch} showToast={showToast} />}
          {currentView === 'weekly-metrics' && <WeeklyMetricsPage branch={branch} showToast={showToast} />}
          {currentView === 'newbie-adaptation' && <NewbieAdaptationPage branch={branch} showToast={showToast} />}
          {currentView === 'master-plans' && <MasterPlansPage branch={branch} showToast={showToast} />}
          {currentView === 'reviews' && <ReviewsPage branch={branch} showToast={showToast} />}
          {currentView === 'branch-summary' && <BranchSummaryPage branch={branch} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================

const Dashboard = ({ branch }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Утренних мероприятий</h3>
        <Icons.Calendar className="w-5 h-5 text-blue-600" />
      </div>
      <p className="text-3xl font-bold text-gray-800">12</p>
      <p className="text-sm text-green-600 mt-2">за этот месяц</p>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Полевых выходов</h3>
        <Icons.Users className="w-5 h-5 text-blue-600" />
      </div>
      <p className="text-3xl font-bold text-gray-800">8</p>
      <p className="text-sm text-green-600 mt-2">за этот месяц</p>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">One-on-One</h3>
        <Icons.Users className="w-5 h-5 text-blue-600" />
      </div>
      <p className="text-3xl font-bold text-gray-800">15</p>
      <p className="text-sm text-green-600 mt-2">за этот месяц</p>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Средняя оценка</h3>
        <Icons.Star className="w-5 h-5 text-yellow-500" filled />
      </div>
      <p className="text-3xl font-bold text-gray-800">8.5</p>
      <p className="text-sm text-gray-600 mt-2">из 10</p>
    </div>
  </div>
);


// ==================== FORM 1: УТРЕННИЕ МЕРОПРИЯТИЯ ====================
// ИСПРАВЛЕНО: Автоматический расчет недели

const MorningEventsPage = ({ branch, showToast }) => {
  const [view, setView] = useState('form');
  const [events, setEvents] = useState([{ week: '', date: '', event_type: '', participants: '', efficiency: 1, comment: '' }]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addEvent = () => {
    setEvents([...events, { week: '', date: '', event_type: '', participants: '', efficiency: 1, comment: '' }]);
  };

  const removeEvent = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index, field, value) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    
    // ИСПРАВЛЕНО: Автоматический расчет недели при изменении даты
    if (field === 'date' && value) {
      newEvents[index]['week'] = getWeekNumber(value);
    }
    
    setEvents(newEvents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.request(`/morning-events/${branch.name}`, {
        method: 'POST',
        body: JSON.stringify(events.map(e => ({
          week: parseInt(e.week) || getWeekNumber(e.date),
          date: e.date,
          event_type: e.event_type,
          participants: parseInt(e.participants),
          efficiency: parseInt(e.efficiency),
          comment: e.comment || ''
        }))),
      });

      showToast('Мероприятия успешно добавлены!');
      setEvents([{ week: '', date: '', event_type: '', participants: '', efficiency: 1, comment: '' }]);
      loadHistory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.request(`/morning-events/${branch.name}`);
      setHistory(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setView('form')} className={`px-6 py-3 rounded-lg font-medium transition-all ${view === 'form' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          Добавить мероприятия
        </button>
        <button onClick={() => setView('history')} className={`px-6 py-3 rounded-lg font-medium transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          История ({history.length})
        </button>
      </div>

      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Мероприятие #{index + 1}</h3>
                {events.length > 1 && (
                  <button type="button" onClick={() => removeEvent(index)} className="text-red-600 hover:text-red-800">
                    <Icons.X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Дата" tooltip="Неделя рассчитается автоматически" required>
                  <input
                    type="date"
                    value={event.date}
                    onChange={(e) => updateEvent(index, 'date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </FormInput>

                <FormInput label="Неделя года" tooltip="Рассчитывается автоматически">
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={event.week}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Автоматически"
                  />
                </FormInput>

                <FormInput label="Тип мероприятия" tooltip="Например: запуск дня, срез, допы, улучшения" required>
                  <input
                    type="text"
                    value={event.event_type}
                    onChange={(e) => updateEvent(index, 'event_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="запуск дня, срез, допы..."
                    required
                  />
                </FormInput>

                <FormInput label="Количество участников" required>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={event.participants}
                    onChange={(e) => updateEvent(index, 'participants', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </FormInput>

                <FormInput label="Эффективность (1-5)" required>
                  <select
                    value={event.efficiency}
                    onChange={(e) => updateEvent(index, 'efficiency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} - {['Низкая', 'Ниже средней', 'Средняя', 'Хорошая', 'Отличная'][n-1]}</option>
                    ))}
                  </select>
                </FormInput>

                <FormInput label="Комментарий" tooltip="Итоги, настроение, особенности">
                  <textarea
                    value={event.comment}
                    onChange={(e) => updateEvent(index, 'comment', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Кратко опишите итоги мероприятия..."
                  />
                </FormInput>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={addEvent}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <Icons.Plus className="w-5 h-5" />
              Добавить еще мероприятие
            </button>

            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить всё'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Неделя</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Участники</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Эффективность</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Дата']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Неделя']}</td>
                    <td className="px-6 py-4 text-sm">{item['Тип мероприятия']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Участники']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item['Эффективность']}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item['Комментарий']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== FORM 2: ПОЛЕВЫЕ ВЫХОДЫ ====================

const FieldVisitsPage = ({ branch, showToast }) => {
  const [view, setView] = useState('form');
  const [visits, setVisits] = useState([{date: '', master_name: '', haircut_quality: 5, service_quality: 5, additional_services_comment: '', additional_services_rating: 5, cosmetics_comment: '', cosmetics_rating: 5, standards_comment: '', standards_rating: 5, errors_comment: '', next_check_date: ''}]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addVisit = () => { setVisits([...visits, {date: '', master_name: '', haircut_quality: 5, service_quality: 5, additional_services_comment: '', additional_services_rating: 5, cosmetics_comment: '', cosmetics_rating: 5, standards_comment: '', standards_rating: 5, errors_comment: '', next_check_date: ''}]); };
  const removeVisit = (index) => { setVisits(visits.filter((_, i) => i !== index)); };
  const updateVisit = (index, field, value) => { const newVisits = [...visits]; newVisits[index][field] = value; setVisits(newVisits); };
  const calculateAverage = (visit) => { return ((visit.haircut_quality + visit.service_quality + visit.additional_services_rating + visit.cosmetics_rating + visit.standards_rating) / 5).toFixed(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/field-visits/${branch.name}`, { method: 'POST', body: JSON.stringify(visits) });
      showToast('Полевые выходы успешно добавлены!');
      setVisits([{date: '', master_name: '', haircut_quality: 5, service_quality: 5, additional_services_comment: '', additional_services_rating: 5, cosmetics_comment: '', cosmetics_rating: 5, standards_comment: '', standards_rating: 5, errors_comment: '', next_check_date: ''}]);
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/field-visits/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setView('form')} className={`px-6 py-3 rounded-lg font-medium transition-all ${view === 'form' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>Добавить проверки</button>
        <button onClick={() => setView('history')} className={`px-6 py-3 rounded-lg font-medium transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>История ({history.length})</button>
      </div>

      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {visits.map((visit, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Полевой выход #{index + 1}</h3>
                  <p className="text-sm text-gray-500 mt-1">Средняя оценка: {calculateAverage(visit)}/10</p>
                </div>
                {visits.length > 1 && <button type="button" onClick={() => removeVisit(index)} className="text-red-600"><Icons.X className="w-5 h-5" /></button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Дата" required><input type="date" value={visit.date} onChange={(e) => updateVisit(index, 'date', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
                <FormInput label="Имя мастера" required><input type="text" value={visit.master_name} onChange={(e) => updateVisit(index, 'master_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
                <FormInput label="Качество стрижек" required><StarRating value={visit.haircut_quality} onChange={(val) => updateVisit(index, 'haircut_quality', val)} /></FormInput>
                <FormInput label="Качество сервиса" required><StarRating value={visit.service_quality} onChange={(val) => updateVisit(index, 'service_quality', val)} /></FormInput>
                <FormInput label="Предложение доп. услуг (комментарий)"><textarea value={visit.additional_services_comment} onChange={(e) => updateVisit(index, 'additional_services_comment', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} placeholder="Описание ситуации..." /></FormInput>
                <FormInput label="Предложение доп. услуг (оценка)" required><StarRating value={visit.additional_services_rating} onChange={(val) => updateVisit(index, 'additional_services_rating', val)} /></FormInput>
                <FormInput label="Предложение косметики (комментарий)"><textarea value={visit.cosmetics_comment} onChange={(e) => updateVisit(index, 'cosmetics_comment', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} /></FormInput>
                <FormInput label="Предложение косметики (оценка)" required><StarRating value={visit.cosmetics_rating} onChange={(val) => updateVisit(index, 'cosmetics_rating', val)} /></FormInput>
                <FormInput label="Соответствие стандартам (комментарий)"><textarea value={visit.standards_comment} onChange={(e) => updateVisit(index, 'standards_comment', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} /></FormInput>
                <FormInput label="Соответствие стандартам (оценка)" required><StarRating value={visit.standards_rating} onChange={(val) => updateVisit(index, 'standards_rating', val)} /></FormInput>
                <FormInput label="Выявление ошибок"><textarea value={visit.errors_comment} onChange={(e) => updateVisit(index, 'errors_comment', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} placeholder="Ошибок выявлено не было..." /></FormInput>
                <FormInput label="Дата следующей проверки"><input type="date" value={visit.next_check_date} onChange={(e) => updateVisit(index, 'next_check_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg" /></FormInput>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button type="button" onClick={addVisit} className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"><Icons.Plus className="w-5 h-5" />Добавить еще мастера</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Сохранение...' : 'Сохранить всё'}</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Мастер</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Стрижки</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сервис</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Общая оценка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Дата']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item['Имя мастера']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Качество стрижек']}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item['Качество сервиса']}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${item['Общая оценка'] >= 8 ? 'bg-green-100 text-green-800' : item['Общая оценка'] >= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{item['Общая оценка']}/10</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== ОСТАЛЬНЫЕ ФОРМЫ (3-8) - ПОЛНАЯ РЕАЛИЗАЦИЯ ====================

// FORM 3: ONE-ON-ONE
const OneOnOnePage = ({ branch, showToast }) => {
  const [view, setView] = useState('form');
  const [meetings, setMeetings] = useState([{date: '', master_name: '', goal: '', results: '', development_plan: '', indicator: '', next_meeting_date: ''}]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addMeeting = () => { setMeetings([...meetings, {date: '', master_name: '', goal: '', results: '', development_plan: '', indicator: '', next_meeting_date: ''}]); };
  const removeMeeting = (index) => { setMeetings(meetings.filter((_, i) => i !== index)); };
  const updateMeeting = (index, field, value) => { const newMeetings = [...meetings]; newMeetings[index][field] = value; setMeetings(newMeetings); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/one-on-one/${branch.name}`, { method: 'POST', body: JSON.stringify(meetings) });
      showToast('Встречи успешно добавлены!');
      setMeetings([{date: '', master_name: '', goal: '', results: '', development_plan: '', indicator: '', next_meeting_date: ''}]);
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/one-on-one/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setView('form')} className={`px-6 py-3 rounded-lg font-medium ${view === 'form' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>Добавить встречи</button>
        <button onClick={() => setView('history')} className={`px-6 py-3 rounded-lg font-medium ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>История ({history.length})</button>
      </div>
      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {meetings.map((meeting, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">One-on-One #{index + 1}</h3>
                {meetings.length > 1 && <button type="button" onClick={() => removeMeeting(index)} className="text-red-600"><Icons.X className="w-5 h-5" /></button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Дата встречи" required><input type="date" value={meeting.date} onChange={(e) => updateMeeting(index, 'date', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
                <FormInput label="Имя мастера" required><input type="text" value={meeting.master_name} onChange={(e) => updateMeeting(index, 'master_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
                <FormInput label="Цель встречи" tooltip="Например: повышение среднего чека" required><textarea value={meeting.goal} onChange={(e) => updateMeeting(index, 'goal', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} required /></FormInput>
                <FormInput label="Результаты" tooltip="Фактические достижения"><textarea value={meeting.results} onChange={(e) => updateMeeting(index, 'results', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} required /></FormInput>
                <FormInput label="План развития" tooltip="Цели до следующей встречи"><textarea value={meeting.development_plan} onChange={(e) => updateMeeting(index, 'development_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} required /></FormInput>
                <FormInput label="Показатель"><input type="text" value={meeting.indicator} onChange={(e) => updateMeeting(index, 'indicator', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Средний чек — 1200" required /></FormInput>
                <FormInput label="Дата следующей встречи"><input type="date" value={meeting.next_meeting_date} onChange={(e) => updateMeeting(index, 'next_meeting_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg" /></FormInput>
              </div>
            </div>
          ))}
          <div className="flex gap-4">
            <button type="button" onClick={addMeeting} className="px-6 py-3 bg-green-600 text-white rounded-lg"><Icons.Plus className="w-5 h-5 inline mr-2" />Добавить встречу</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th><th className="px-6 py-3 text-left">Мастер</th><th className="px-6 py-3 text-left">Цель</th><th className="px-6 py-3 text-left">Показатель</th></tr></thead>
            <tbody className="divide-y">{history.map((item, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{item['Дата встречи']}</td><td className="px-6 py-4 text-sm">{item['Имя мастера']}</td><td className="px-6 py-4 text-sm">{item['Цель встречи']}</td><td className="px-6 py-4 text-sm">{item['Показатель']}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// FORM 4: ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ
const WeeklyMetricsPage = ({ branch, showToast }) => {
  const [metrics, setMetrics] = useState({period: '', average_check_plan: '', average_check_fact: '', cosmetics_plan: '', cosmetics_fact: '', additional_services_plan: '', additional_services_fact: ''});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/weekly-metrics/${branch.name}`, { method: 'POST', body: JSON.stringify({...metrics, average_check_plan: parseFloat(metrics.average_check_plan), average_check_fact: parseFloat(metrics.average_check_fact), cosmetics_plan: parseFloat(metrics.cosmetics_plan), cosmetics_fact: parseFloat(metrics.cosmetics_fact), additional_services_plan: parseFloat(metrics.additional_services_plan), additional_services_fact: parseFloat(metrics.additional_services_fact)}) });
      showToast('Показатели успешно добавлены!');
      setMetrics({period: '', average_check_plan: '', average_check_fact: '', cosmetics_plan: '', cosmetics_fact: '', additional_services_plan: '', additional_services_fact: ''});
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/weekly-metrics/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  const calcPerformance = (fact, plan) => plan > 0 ? ((fact / plan) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Период" tooltip="Например: 1-я неделя января" required><input type="text" value={metrics.period} onChange={(e) => setMetrics({...metrics, period: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <div></div>
          <FormInput label="Средний чек (план)" required><input type="number" step="0.01" value={metrics.average_check_plan} onChange={(e) => setMetrics({...metrics, average_check_plan: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Средний чек (факт)" required><input type="number" step="0.01" value={metrics.average_check_fact} onChange={(e) => setMetrics({...metrics, average_check_fact: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Косметика (план)" required><input type="number" step="0.01" value={metrics.cosmetics_plan} onChange={(e) => setMetrics({...metrics, cosmetics_plan: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Косметика (факт)" required><input type="number" step="0.01" value={metrics.cosmetics_fact} onChange={(e) => setMetrics({...metrics, cosmetics_fact: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Доп. услуги (план)" required><input type="number" step="0.01" value={metrics.additional_services_plan} onChange={(e) => setMetrics({...metrics, additional_services_plan: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Доп. услуги (факт)" required><input type="number" step="0.01" value={metrics.additional_services_fact} onChange={(e) => setMetrics({...metrics, additional_services_fact: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
        </div>
        {metrics.average_check_plan && metrics.average_check_fact && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Предварительные результаты:</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Средний чек: <span className="font-bold">{calcPerformance(metrics.average_check_fact, metrics.average_check_plan)}%</span></div>
              <div>Косметика: <span className="font-bold">{calcPerformance(metrics.cosmetics_fact, metrics.cosmetics_plan)}%</span></div>
              <div>Доп. услуги: <span className="font-bold">{calcPerformance(metrics.additional_services_fact, metrics.additional_services_plan)}%</span></div>
            </div>
          </div>
        )}
        <button type="submit" disabled={loading} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Период</th><th className="px-6 py-3 text-left">Средний чек %</th><th className="px-6 py-3 text-left">Косметика %</th><th className="px-6 py-3 text-left">Доп. услуги %</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4">{item['Период']}</td><td className="px-6 py-4">{item['Выполнение среднего чека %']}%</td><td className="px-6 py-4">{item['Выполнение косметики %']}%</td><td className="px-6 py-4">{item['Выполнение доп. услуг %']}%</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// FORM 5: АДАПТАЦИЯ НОВИЧКОВ
const NewbieAdaptationPage = ({ branch, showToast }) => {
  const [adaptations, setAdaptations] = useState([{start_date: '', name: '', haircut_practice: '', service_standards: '', hygiene_sanitation: '', additional_services: '', cosmetics_sales: '', iclient_basics: '', status: 'В процессе'}]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addAdaptation = () => { setAdaptations([...adaptations, {start_date: '', name: '', haircut_practice: '', service_standards: '', hygiene_sanitation: '', additional_services: '', cosmetics_sales: '', iclient_basics: '', status: 'В процессе'}]); };
  const removeAdaptation = (index) => { setAdaptations(adaptations.filter((_, i) => i !== index)); };
  const updateAdaptation = (index, field, value) => { const newAdapt = [...adaptations]; newAdapt[index][field] = value; setAdaptations(newAdapt); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/newbie-adaptation/${branch.name}`, { method: 'POST', body: JSON.stringify(adaptations) });
      showToast('Адаптации успешно добавлены!');
      setAdaptations([{start_date: '', name: '', haircut_practice: '', service_standards: '', hygiene_sanitation: '', additional_services: '', cosmetics_sales: '', iclient_basics: '', status: 'В процессе'}]);
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/newbie-adaptation/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {adaptations.map((adapt, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Новичок #{index + 1}</h3>
              {adaptations.length > 1 && <button type="button" onClick={() => removeAdaptation(index)} className="text-red-600"><Icons.X className="w-5 h-5" /></button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Дата начала" required><input type="date" value={adapt.start_date} onChange={(e) => updateAdaptation(index, 'start_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Имя новичка" required><input type="text" value={adapt.name} onChange={(e) => updateAdaptation(index, 'name', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Практика стрижек"><select value={adapt.haircut_practice} onChange={(e) => updateAdaptation(index, 'haircut_practice', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Стандарты сервиса"><select value={adapt.service_standards} onChange={(e) => updateAdaptation(index, 'service_standards', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Гигиена и санитария"><select value={adapt.hygiene_sanitation} onChange={(e) => updateAdaptation(index, 'hygiene_sanitation', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Доп. услуги"><select value={adapt.additional_services} onChange={(e) => updateAdaptation(index, 'additional_services', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Продажа косметики"><select value={adapt.cosmetics_sales} onChange={(e) => updateAdaptation(index, 'cosmetics_sales', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Основы iClient"><select value={adapt.iclient_basics} onChange={(e) => updateAdaptation(index, 'iclient_basics', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option><option value="Не начато">Не начато</option><option value="В процессе">В процессе</option><option value="Завершено">Завершено</option></select></FormInput>
              <FormInput label="Статус адаптации"><select value={adapt.status} onChange={(e) => updateAdaptation(index, 'status', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="В процессе">В процессе</option><option value="Завершена">Завершена</option><option value="Приостановлена">Приостановлена</option></select></FormInput>
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <button type="button" onClick={addAdaptation} className="px-6 py-3 bg-green-600 text-white rounded-lg"><Icons.Plus className="w-5 h-5 inline mr-2" />Добавить новичка</button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Дата начала</th><th className="px-6 py-3 text-left">Имя</th><th className="px-6 py-3 text-left">Статус</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4">{item['Дата начала']}</td><td className="px-6 py-4">{item['Имя новичка']}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${item['Статус адаптации'] === 'Завершена' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item['Статус адаптации']}</span></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// FORM 6: ПЛАНЫ МАСТЕРОВ
const MasterPlansPage = ({ branch, showToast }) => {
  const [plans, setPlans] = useState([{month: '', master_name: '', average_check_plan: '', average_check_fact: '', additional_services_plan: '', additional_services_fact: '', sales_plan: '', sales_fact: '', salary_plan: '', salary_fact: ''}]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addPlan = () => { setPlans([...plans, {month: '', master_name: '', average_check_plan: '', average_check_fact: '', additional_services_plan: '', additional_services_fact: '', sales_plan: '', sales_fact: '', salary_plan: '', salary_fact: ''}]); };
  const removePlan = (index) => { setPlans(plans.filter((_, i) => i !== index)); };
  const updatePlan = (index, field, value) => { const newPlans = [...plans]; newPlans[index][field] = value; setPlans(newPlans); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/master-plans/${branch.name}`, { method: 'POST', body: JSON.stringify(plans.map(p => ({...p, average_check_plan: parseFloat(p.average_check_plan), average_check_fact: parseFloat(p.average_check_fact), additional_services_plan: parseInt(p.additional_services_plan), additional_services_fact: parseInt(p.additional_services_fact), sales_plan: parseFloat(p.sales_plan), sales_fact: parseFloat(p.sales_fact), salary_plan: parseFloat(p.salary_plan), salary_fact: parseFloat(p.salary_fact)}))) });
      showToast('Планы успешно добавлены!');
      setPlans([{month: '', master_name: '', average_check_plan: '', average_check_fact: '', additional_services_plan: '', additional_services_fact: '', sales_plan: '', sales_fact: '', salary_plan: '', salary_fact: ''}]);
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/master-plans/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {plans.map((plan, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">План мастера #{index + 1}</h3>
              {plans.length > 1 && <button type="button" onClick={() => removePlan(index)} className="text-red-600"><Icons.X className="w-5 h-5" /></button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Месяц" required><select value={plan.month} onChange={(e) => updatePlan(index, 'month', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option>{['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'].map(m => <option key={m} value={m}>{m}</option>)}</select></FormInput>
              <FormInput label="Имя мастера" required><input type="text" value={plan.master_name} onChange={(e) => updatePlan(index, 'master_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Средний чек (план)" required><input type="number" step="0.01" value={plan.average_check_plan} onChange={(e) => updatePlan(index, 'average_check_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Средний чек (факт)" required><input type="number" step="0.01" value={plan.average_check_fact} onChange={(e) => updatePlan(index, 'average_check_fact', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Доп. услуги кол-во (план)" required><input type="number" value={plan.additional_services_plan} onChange={(e) => updatePlan(index, 'additional_services_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Доп. услуги кол-во (факт)" required><input type="number" value={plan.additional_services_fact} onChange={(e) => updatePlan(index, 'additional_services_fact', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Объем продаж (план)" required><input type="number" step="0.01" value={plan.sales_plan} onChange={(e) => updatePlan(index, 'sales_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Объем продаж (факт)" required><input type="number" step="0.01" value={plan.sales_fact} onChange={(e) => updatePlan(index, 'sales_fact', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Зарплата (план)" required><input type="number" step="0.01" value={plan.salary_plan} onChange={(e) => updatePlan(index, 'salary_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
              <FormInput label="Зарплата (факт)" required><input type="number" step="0.01" value={plan.salary_fact} onChange={(e) => updatePlan(index, 'salary_fact', e.target.value)} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <button type="button" onClick={addPlan} className="px-6 py-3 bg-green-600 text-white rounded-lg"><Icons.Plus className="w-5 h-5 inline mr-2" />Добавить мастера</button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Месяц</th><th className="px-6 py-3 text-left">Мастер</th><th className="px-6 py-3 text-left">Ср. чек %</th><th className="px-6 py-3 text-left">Продажи %</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4">{item['Месяц']}</td><td className="px-6 py-4">{item['Имя мастера']}</td><td className="px-6 py-4">{item['Выполнение среднего чека %']}%</td><td className="px-6 py-4">{item['Выполнение продаж %']}%</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// FORM 7: ОТЗЫВЫ
const ReviewsPage = ({ branch, showToast }) => {
  const [review, setReview] = useState({week: '', manager_name: '', plan: '', fact: '', monthly_target: ''});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/reviews/${branch.name}`, { method: 'POST', body: JSON.stringify({...review, plan: parseInt(review.plan), fact: parseInt(review.fact), monthly_target: parseInt(review.monthly_target)}) });
      showToast('Отзывы успешно добавлены!');
      setReview({week: '', manager_name: '', plan: '', fact: '', monthly_target: ''});
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/reviews/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  const totalReviews = history.reduce((sum, item) => sum + (item['Факт отзывов'] || 0), 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Неделя" required><select value={review.week} onChange={(e) => setReview({...review, week: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option>{['1-я неделя', '2-я неделя', '3-я неделя', '4-я неделя'].map(w => <option key={w} value={w}>{w}</option>)}</select></FormInput>
          <FormInput label="Имя управляющего" required><input type="text" value={review.manager_name} onChange={(e) => setReview({...review, manager_name: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="План отзывов" required><input type="number" value={review.plan} onChange={(e) => setReview({...review, plan: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Факт отзывов" required><input type="number" value={review.fact} onChange={(e) => setReview({...review, fact: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Целевой показатель за месяц" required><input type="number" value={review.monthly_target} onChange={(e) => setReview({...review, monthly_target: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
        </div>
        <button type="submit" disabled={loading} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
      </form>

      {history.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">Сводка за месяц</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-600">Всего отзывов:</span> <span className="font-bold text-2xl">{totalReviews}</span></div>
            <div><span className="text-gray-600">Целевой показатель:</span> <span className="font-bold text-2xl">{review.monthly_target || history[0]['Целевой показатель за месяц']}</span></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Неделя</th><th className="px-6 py-3 text-left">План</th><th className="px-6 py-3 text-left">Факт</th><th className="px-6 py-3 text-left">Выполнение %</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4">{item['Неделя']}</td><td className="px-6 py-4">{item['План отзывов']}</td><td className="px-6 py-4">{item['Факт отзывов']}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-sm ${item['Выполнение недели %'] >= 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item['Выполнение недели %']}%</span></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// FORM 8: СВОДКА ПО ФИЛИАЛУ
const BranchSummaryPage = ({ branch, showToast }) => {
  const [summary, setSummary] = useState({manager: branch.manager || '', month: '', morning_events_goal: '', field_visits_goal: '', one_on_one_goal: '', weekly_reports_goal: '', master_plans_goal: '', reviews_goal: '', new_employees_goal: ''});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/branch-summary/${branch.name}`, { method: 'POST', body: JSON.stringify({...summary, morning_events_goal: parseInt(summary.morning_events_goal), field_visits_goal: parseInt(summary.field_visits_goal), one_on_one_goal: parseInt(summary.one_on_one_goal), weekly_reports_goal: parseInt(summary.weekly_reports_goal), master_plans_goal: parseInt(summary.master_plans_goal), reviews_goal: parseInt(summary.reviews_goal), new_employees_goal: parseInt(summary.new_employees_goal)}) });
      showToast('Сводка успешно сформирована!');
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/branch-summary/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Управляющий" required><input type="text" value={summary.manager} onChange={(e) => setSummary({...summary, manager: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Месяц" required><select value={summary.month} onChange={(e) => setSummary({...summary, month: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option>{['Январь 2026', 'Февраль 2026', 'Март 2026', 'Апрель 2026', 'Май 2026', 'Июнь 2026', 'Июль 2026', 'Август 2026', 'Сентябрь 2026', 'Октябрь 2026', 'Ноябрь 2026', 'Декабрь 2026'].map(m => <option key={m} value={m}>{m}</option>)}</select></FormInput>
          <FormInput label="Цель: Утренние мероприятия" required><input type="number" value={summary.morning_events_goal} onChange={(e) => setSummary({...summary, morning_events_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: Полевые выходы" required><input type="number" value={summary.field_visits_goal} onChange={(e) => setSummary({...summary, field_visits_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: One-on-One" required><input type="number" value={summary.one_on_one_goal} onChange={(e) => setSummary({...summary, one_on_one_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: Еженедельные отчёты" required><input type="number" value={summary.weekly_reports_goal} onChange={(e) => setSummary({...summary, weekly_reports_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: Планы мастеров" required><input type="number" value={summary.master_plans_goal} onChange={(e) => setSummary({...summary, master_plans_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: Отзывы" required><input type="number" value={summary.reviews_goal} onChange={(e) => setSummary({...summary, reviews_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="Цель: Новые сотрудники" required><input type="number" value={summary.new_employees_goal} onChange={(e) => setSummary({...summary, new_employees_goal: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
        </div>
        <button type="submit" disabled={loading} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сформировать сводку' : 'Сформировать'}</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Метрика</th><th className="px-6 py-3 text-left">Текущее</th><th className="px-6 py-3 text-left">Цель</th><th className="px-6 py-3 text-left">%</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4 font-medium">{item['Метрика']}</td><td className="px-6 py-4">{item['Текущее количество']}</td><td className="px-6 py-4">{item['Цель на месяц']}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded text-sm font-medium ${item['Выполнение %'] >= 100 ? 'bg-green-100 text-green-800' : item['Выполнение %'] >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{item['Выполнение %']}%</span></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

const App = () => {
  const [branch, setBranch] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedBranch = localStorage.getItem('barber_branch');
    const savedToken = localStorage.getItem('barber_token');
    
    if (savedBranch && savedToken) {
      try {
        setBranch(JSON.parse(savedBranch));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('barber_branch');
        localStorage.removeItem('barber_token');
      }
    }
  }, []);

  const handleAuth = (branchData, authToken) => {
    setBranch(branchData);
    setToken(authToken);
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
