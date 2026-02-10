
const { useState, useEffect, useRef } = React;

// ==================== CONFIG ====================
const API_BASE_URL = 'http://166.1.201.124:8000';

// Фиксированные цели для каждого филиала
const BRANCH_GOALS = {
  morning_events: 16,
  field_visits: 4,
  one_on_one: 6,
  weekly_reports: 4,
  master_plans: 10,
  reviews: 60,
  new_employees: 10
};

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

// Получение текущего месяца
const getCurrentMonth = () => {
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

// ==================== ICONS (ОБНОВЛЕНО - больше разных иконок) ====================
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
  ),
  Info: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  ChevronDown: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
  ),
  ChevronUp: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
  ),
  // НОВЫЕ ИКОНКИ для разных вкладок
  Sunrise: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Clipboard: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ),
  UserGroup: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ),
  TrendingUp: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  ),
  AcademicCap: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
  ),
  Target: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  ChatAlt: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
  ),
  ClipboardList: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  ),
  Dashboard: ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" /></svg>
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

// ОБНОВЛЕНО v3.1.1: Компонент с инструкцией - теперь СВОРАЧИВАЕМЫЙ
const InstructionBanner = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icons.Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <h4 className="font-semibold text-blue-900">{title}</h4>
        </div>
        {isOpen ? (
          <Icons.ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <Icons.ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-blue-800 space-y-2 animate-fade-in">
          {children}
        </div>
      )}
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
          <p className="text-gray-600">v3.1.1 FINAL - Исправления</p>
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

  // ОБНОВЛЕНО v3.1.1: Разные иконки для каждой вкладки
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: Icons.Dashboard },
    { id: 'morning-events', label: 'Утренние мероприятия', icon: Icons.Sunrise },
    { id: 'field-visits', label: 'Полевые выходы', icon: Icons.Clipboard },
    { id: 'one-on-one', label: 'One-on-One', icon: Icons.UserGroup },
    { id: 'weekly-metrics', label: 'Еженедельные показатели', icon: Icons.TrendingUp },
    { id: 'newbie-adaptation', label: 'Адаптация новичков', icon: Icons.AcademicCap },
    { id: 'master-plans', label: 'Планы мастеров', icon: Icons.Target },
    { id: 'reviews', label: 'Отзывы', icon: Icons.ChatAlt },
    { id: 'branch-summary', label: 'Сводка', icon: Icons.ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar */}
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

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Фоновый PNG логотип с прозрачностью 10% */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'url(/logo.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '50%',
          opacity: 0.10,
          zIndex: 0
        }}></div>

        <div className="p-8 relative z-10">
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

const Dashboard = ({ branch }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await api.request(`/dashboard-summary/${branch.name}`);
        setSummary(data.summary);
      } catch (err) {
        console.error('Ошибка загрузки сводки:', err);
        setSummary({
          morning_events: { current: 0, goal: BRANCH_GOALS.morning_events, percentage: 0, label: "Утренние мероприятия" },
          field_visits: { current: 0, goal: BRANCH_GOALS.field_visits, percentage: 0, label: "Полевые выходы" },
          one_on_one: { current: 0, goal: BRANCH_GOALS.one_on_one, percentage: 0, label: "One-on-One" },
          master_plans: { current: 0, goal: BRANCH_GOALS.master_plans, percentage: 0, label: "Планы мастеров" }
        });
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [branch.name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  if (!summary) return <div>Нет данных</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Утренних мероприятий</h3>
            <Icons.Sunrise className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.morning_events?.current || 0}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Цель: {summary.morning_events?.goal || BRANCH_GOALS.morning_events}</p>
            <span className={`text-sm font-medium ${summary.morning_events?.percentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {summary.morning_events?.percentage || 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Полевых выходов</h3>
            <Icons.Clipboard className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.field_visits?.current || 0}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Цель: {summary.field_visits?.goal || BRANCH_GOALS.field_visits}</p>
            <span className={`text-sm font-medium ${summary.field_visits?.percentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {summary.field_visits?.percentage || 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">One-on-One</h3>
            <Icons.UserGroup className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.one_on_one?.current || 0}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Цель: {summary.one_on_one?.goal || BRANCH_GOALS.one_on_one}</p>
            <span className={`text-sm font-medium ${summary.one_on_one?.percentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {summary.one_on_one?.percentage || 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Планы мастеров</h3>
            <Icons.Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.master_plans?.current || 0}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Цель: {summary.master_plans?.goal || BRANCH_GOALS.master_plans}</p>
            <span className={`text-sm font-medium ${summary.master_plans?.percentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {summary.master_plans?.percentage || 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Дополнительные показатели</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Еженедельные отчёты</p>
            <p className="text-2xl font-bold text-gray-800">{summary.weekly_reports?.current || 0} / {BRANCH_GOALS.weekly_reports}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Отзывы</p>
            <p className="text-2xl font-bold text-gray-800">{summary.reviews?.current || 0} / {BRANCH_GOALS.reviews}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Новые сотрудники</p>
            <p className="text-2xl font-bold text-gray-800">{summary.new_employees?.current || 0} / {BRANCH_GOALS.new_employees}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== FORM 1: УТРЕННИЕ МЕРОПРИЯТИЯ ====================

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
      <InstructionBanner title="Инструкция по заполнению отчёта «Утренние мероприятия»">
        <p>В каждую строку отчёта заносите отдельное мероприятие, проведённое утром (до открытия или перед стартом рабочего дня).</p>
        <p className="mt-2"><strong>Заполняйте следующие поля:</strong></p>
        <p>• <strong>Неделя</strong> — номер текущей недели (рассчитывается автоматически)</p>
        <p>• <strong>Дата</strong> — день проведения мероприятия</p>
        <p>• <strong>Тип мероприятия</strong> — формат или название активности (например: запуск дня, мотивационная встреча, обсуждение целей, командная активность)</p>
        <p>• <strong>Участники</strong> — количество присутствовавших сотрудников</p>
        <p>• <strong>Эффективность (1-5)</strong> — оценка эффективности мероприятия по пятибалльной шкале (где 5 — максимум, 1 — низкая отдача), можно выставлять по ощущениям или собирая обратную связь</p>
        <p>• <strong>Комментарий</strong> — коротко опишите итоги, настроение, особенности (что обсуждали, что удалось, кто отсутствовал, результаты)</p>
      </InstructionBanner>

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

                <FormInput label="Тип мероприятия" required>
                  <input
                    type="text"
                    value={event.event_type}
                    onChange={(e) => updateEvent(index, 'event_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="запуск дня, мотивационная встреча..."
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

                <FormInput label="Комментарий">
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

// ==================== FORM 2: ПОЛЕВЫЕ ВЫХОДЫ (ИСПРАВЛЕН БАГ С ОЦЕНКОЙ) ====================

const FieldVisitsPage = ({ branch, showToast }) => {
  const [view, setView] = useState('form');
  const [visits, setVisits] = useState([{date: '', master_name: '', haircut_quality: 5, service_quality: 5, additional_services_comment: '', additional_services_rating: 5, cosmetics_comment: '', cosmetics_rating: 5, standards_comment: '', standards_rating: 5, errors_comment: '', next_check_date: ''}]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const addVisit = () => { setVisits([...visits, {date: '', master_name: '', haircut_quality: 5, service_quality: 5, additional_services_comment: '', additional_services_rating: 5, cosmetics_comment: '', cosmetics_rating: 5, standards_comment: '', standards_rating: 5, errors_comment: '', next_check_date: ''}]); };
  const removeVisit = (index) => { setVisits(visits.filter((_, i) => i !== index)); };
  const updateVisit = (index, field, value) => { const newVisits = [...visits]; newVisits[index][field] = value; setVisits(newVisits); };
  
  // ИСПРАВЛЕНО v3.1.1: Правильный расчет среднего (делим на 5, а не суммируем)
  const calculateAverage = (visit) => { 
    return ((visit.haircut_quality + visit.service_quality + visit.additional_services_rating + visit.cosmetics_rating + visit.standards_rating) / 5).toFixed(1); 
  };

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
      <InstructionBanner title="Полевые выходы">
        <p>Проверка работы мастеров на местах.</p>
        <p className="mt-2"><strong>Общая оценка рассчитывается автоматически</strong> как среднее значение из 5 критериев по 10-балльной шкале:</p>
        <p>• Качество стрижек (1-10)</p>
        <p>• Качество сервиса (1-10)</p>
        <p>• Предложение доп. услуг (1-10)</p>
        <p>• Предложение косметики (1-10)</p>
        <p>• Соответствие стандартам (1-10)</p>
        <p className="mt-2">Оставляйте комментарии к каждому критерию для детальной обратной связи.</p>
      </InstructionBanner>

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
                  <p className="text-sm text-gray-500 mt-1">Средняя оценка: <span className="font-bold text-blue-600">{calculateAverage(visit)}/10</span></p>
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

// ==================== Продолжение в Part4_v2.jsx ====================

// ==================== FORM 3: ONE-ON-ONE (ОБНОВЛЕНА ИНСТРУКЦИЯ) ====================

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
      <InstructionBanner title="Инструкция по заполнению отчёта «1-ON-1 ВСТРЕЧИ»">
        <p>В каждой строке указывайте данные для одного сотрудника по итогам встречи.</p>
        <p className="mt-2">• <strong>Дата встречи</strong> — укажите день, когда прошла встреча</p>
        <p>• <strong>Мастер</strong> — запишите имя сотрудника, с кем проходила встреча</p>
        <p>• <strong>Стояла цель</strong> — укажите задачу, которую поставили сотруднику на прошлой встрече (например: увеличить количество записей на 5 клиентов, повысить средний чек до 1500₽)</p>
        <p>• <strong>Результаты работы</strong> — кратко опишите, достигнута ли прошлая цель, что получилось или не удалось выполнить</p>
        <p>• <strong>План развития до следующей встречи</strong> — запишите новые задачи или шаги для сотрудника до следующей 1-ON-1 (например: освоить новый сервис, привести 3 друга, пройти обучение)</p>
        <p>• <strong>Показатель</strong> — главный KPI сотрудника (например, средний чек, процент лояльности, количество записей)</p>
        <p>• <strong>Дата следующей встречи</strong> — запишите дату запланированной встречи</p>
        <p>• <strong>Статус</strong> — отметьте статус задачи: выполнено / в процессе / не выполнено</p>
      </InstructionBanner>

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
                <FormInput label="Стояла цель" required><textarea value={meeting.goal} onChange={(e) => updateMeeting(index, 'goal', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} placeholder="Например: повысить средний чек до 1500₽" required /></FormInput>
                <FormInput label="Результаты работы" required><textarea value={meeting.results} onChange={(e) => updateMeeting(index, 'results', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} required /></FormInput>
                <FormInput label="План развития до следующей встречи" required><textarea value={meeting.development_plan} onChange={(e) => updateMeeting(index, 'development_plan', e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={2} placeholder="Например: освоить новый сервис, привести 3 друга" required /></FormInput>
                <FormInput label="Показатель (KPI)" required><input type="text" value={meeting.indicator} onChange={(e) => updateMeeting(index, 'indicator', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Средний чек, количество записей..." required /></FormInput>
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
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th><th className="px-6 py-3 text-left">Мастер</th><th className="px-6 py-3 text-left">Стояла цель</th><th className="px-6 py-3 text-left">Показатель</th></tr></thead>
            <tbody className="divide-y">{history.map((item, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{item['Дата встречи']}</td><td className="px-6 py-4 text-sm">{item['Имя мастера']}</td><td className="px-6 py-4 text-sm">{item['Цель встречи']}</td><td className="px-6 py-4 text-sm">{item['Показатель']}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== FORM 4: ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ (ОБНОВЛЕНА ИНСТРУКЦИЯ) ====================

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
      <InstructionBanner title="Справка по выставлению планов">
        <p><strong>Средний чек план:</strong> средняя стоимость стрижки по филиалу (цена стрижки у каждого мастера / кол-во мастеров) + 25%</p>
        <p><strong>Косметика план:</strong> 10% от оборота (iClient → Основные показатели → Доход)</p>
        <p><strong>Доп. услуги план:</strong> 50% от количества завершённых записей (iClient → Основные показатели → Завершенные записи)</p>
      </InstructionBanner>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Период" tooltip="Например: 1-я неделя января" required><input type="text" value={metrics.period} onChange={(e) => setMetrics({...metrics, period: e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="1-я неделя января" required /></FormInput>
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

// ==================== FORM 5: АДАПТАЦИЯ НОВИЧКОВ (ОБНОВЛЕНА ИНСТРУКЦИЯ) ====================

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
      <InstructionBanner title="Справка по адаптации новичков">
        <p><strong>Основные техники</strong> — базовые профессиональные навыки барбера: техника стрижки, бритья, укладки; умение пользоваться инструментом. Критерий считается выполненным, если новичок овладел стандартными техниками, необходимыми для работы в филиале.</p>
        <p className="mt-2"><strong>Стандарты сервиса</strong> — умение соблюдать корпоративные правила обслуживания клиентов: приветствие, ведение беседы, предложение услуг, завершение работы. Важно поддерживать фирменный стиль общения и делать сервис отличительным для сети.</p>
        <p className="mt-2"><strong>Корпоративная культура</strong> — знание и принятие ценностей и внутренних правил компании: уважение к команде, аккуратность, пунктуальность, участие в мероприятиях филиала. Критерий показывает, насколько новичок интегрирован в коллектив и придерживается общих принципов.</p>
        <p className="mt-2"><strong>Обучение доп. услугам</strong> — освоение дополнительных процедур (например, уход за бородой, камуфляж седины, оформление бровей и пр.). Необходимо не только знать технику, но и уметь предлагать эти услуги клиентам.</p>
        <p className="mt-2"><strong>Знания косметики</strong> — знакомство с ассортиментом продаваемых средств, умение объяснить преимущества косметики клиенту, знание техники продаж. Оценивается как теоретическая подготовка, так и фактические продажи.</p>
        <p className="mt-2"><strong>Процент завершения</strong> — сколько процентов от адаптации пройдено новичком (рассчитывается по количеству выполненных критериев).</p>
        <p><strong>Дата завершения</strong> — день, когда новичок полностью завершил программу адаптации.</p>
        <p><strong>Статус</strong> — текущий этап: "В процессе", "Выполнено" или "Не выполнено".</p>
      </InstructionBanner>

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

// ==================== FORM 6: ПЛАНЫ МАСТЕРОВ (ОБНОВЛЕНА ИНСТРУКЦИЯ) ====================

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
      <InstructionBanner title="Инструкция: Индивидуальные планы мастеров">
        <p>Индивидуальный план мастера формируется партнёром в начале каждого месяца и состоит из 4 ключевых показателей:</p>
        <p className="mt-2">• <strong>Средний чек</strong></p>
        <p>• <strong>Зарплата за месяц</strong></p>
        <p>• <strong>Кол-во доп. услуг</strong> (и каких именно)</p>
        <p>• <strong>Объём продаж</strong> (допы + косметика)</p>
        <p className="mt-2">Управляющий в течение месяца фиксирует факт по каждому показателю.</p>
        <p className="mt-2">На 1-on-1 встрече в конце месяца партнёр и мастер:</p>
        <p>• анализируют выполнение плана</p>
        <p>• обсуждают причины успехов и недочётов</p>
        <p>• формируют задачи и новый план на следующий месяц</p>
        <p className="mt-2 font-semibold">Итог: Планы ставятся раз в месяц → факты собираются → на 1-on-1 обсуждаются → корректируются месячные цели</p>
      </InstructionBanner>

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

// ==================== FORM 7: ОТЗЫВЫ ====================

const ReviewsPage = ({ branch, showToast }) => {
  const [review, setReview] = useState({week: '', manager_name: '', plan: 13, fact: '', monthly_target: 52});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/reviews/${branch.name}`, { method: 'POST', body: JSON.stringify({...review, plan: 13, fact: parseInt(review.fact), monthly_target: 52}) });
      showToast('Отзывы успешно добавлены!');
      setReview({week: '', manager_name: '', plan: 13, fact: '', monthly_target: 52});
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/reviews/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  const totalReviews = history.reduce((sum, item) => sum + (item['Факт отзывов'] || 0), 0);

  return (
    <div className="space-y-6">
      <InstructionBanner title="Отзывы">
        <p>Фиксированный план: <strong>13 отзывов в неделю</strong> на филиал.</p>
        <p>Введите факт отзывов за текущую неделю. Процент выполнения рассчитается автоматически.</p>
        <p className="mt-2">Цель на месяц: <strong>52 отзыва</strong> (4 недели × 13 отзывов)</p>
      </InstructionBanner>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Неделя" required><select value={review.week} onChange={(e) => setReview({...review, week: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required><option value="">Выбрать...</option>{['1-я неделя', '2-я неделя', '3-я неделя', '4-я неделя'].map(w => <option key={w} value={w}>{w}</option>)}</select></FormInput>
          <FormInput label="Имя управляющего" required><input type="text" value={review.manager_name} onChange={(e) => setReview({...review, manager_name: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
          <FormInput label="План отзывов (фиксированный)">
            <input type="number" value={13} readOnly className="w-full px-4 py-3 border rounded-lg bg-gray-100" />
          </FormInput>
          <FormInput label="Факт отзывов" required><input type="number" value={review.fact} onChange={(e) => setReview({...review, fact: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required /></FormInput>
        </div>
        <button type="submit" disabled={loading} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Сохранение...' : 'Сохранить'}</button>
      </form>

      {history.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">Сводка за месяц</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-600">Всего отзывов:</span> <span className="font-bold text-2xl">{totalReviews}</span></div>
            <div><span className="text-gray-600">Целевой показатель:</span> <span className="font-bold text-2xl">52</span></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Неделя</th><th className="px-6 py-3 text-left">План</th><th className="px-6 py-3 text-left">Факт</th><th className="px-6 py-3 text-left">Выполнение %</th></tr></thead>
          <tbody className="divide-y">{history.map((item, i) => (<tr key={i}><td className="px-6 py-4">{item['Неделя']}</td><td className="px-6 py-4">13</td><td className="px-6 py-4">{item['Факт отзывов']}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-sm ${item['Выполнение недели %'] >= 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item['Выполнение недели %']}%</span></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== FORM 8: СВОДКА ====================

const BranchSummaryPage = ({ branch, showToast }) => {
  const [summary, setSummary] = useState({manager: branch.manager || '', month: getCurrentMonth()});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request(`/branch-summary/${branch.name}`, { method: 'POST', body: JSON.stringify(summary) });
      showToast('Сводка успешно сформирована!');
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const loadHistory = async () => { try { const data = await api.request(`/branch-summary/${branch.name}`); setHistory(data.data || []); } catch (err) { console.error(err); } };
  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="space-y-6">
      <InstructionBanner title="Сводка по филиалу">
        <p>Автоматический саммари по всем метрикам с процентами выполнения.</p>
        <p className="mt-2"><strong>Цели фиксированные для всех филиалов:</strong></p>
        <p>• Утренние мероприятия: {BRANCH_GOALS.morning_events}</p>
        <p>• Полевые выходы: {BRANCH_GOALS.field_visits}</p>
        <p>• 1-on-1: {BRANCH_GOALS.one_on_one}</p>
        <p>• Еженедельные отчёты: {BRANCH_GOALS.weekly_reports}</p>
        <p>• Планы мастеров: {BRANCH_GOALS.master_plans}</p>
        <p>• Отзывы: {BRANCH_GOALS.reviews}</p>
        <p>• Новые сотрудники: {BRANCH_GOALS.new_employees}</p>
      </InstructionBanner>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Управляющий" required>
            <input type="text" value={summary.manager} onChange={(e) => setSummary({...summary, manager: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
          </FormInput>
          <FormInput label="Месяц" required>
            <select value={summary.month} onChange={(e) => setSummary({...summary, month: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required>
              <option value="">Выбрать...</option>
              {['Январь 2026', 'Февраль 2026', 'Март 2026', 'Апрель 2026', 'Май 2026', 'Июнь 2026', 'Июль 2026', 'Август 2026', 'Сентябрь 2026', 'Октябрь 2026', 'Ноябрь 2026', 'Декабрь 2026'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormInput>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Фиксированные цели для всех филиалов:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>Утренние: <strong>{BRANCH_GOALS.morning_events}</strong></div>
            <div>Полевые: <strong>{BRANCH_GOALS.field_visits}</strong></div>
            <div>1-on-1: <strong>{BRANCH_GOALS.one_on_one}</strong></div>
            <div>Еженедельные: <strong>{BRANCH_GOALS.weekly_reports}</strong></div>
            <div>Планы: <strong>{BRANCH_GOALS.master_plans}</strong></div>
            <div>Отзывы: <strong>{BRANCH_GOALS.reviews}</strong></div>
            <div>Новички: <strong>{BRANCH_GOALS.new_employees}</strong></div>
          </div>
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

// ==================== RENDER ====================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
