import React, { useState, useEffect } from 'react';
import { Plus, Send, CheckCircle2, X, Calendar, Users, TrendingUp, Star, BarChart3, ClipboardCheck, Target, MessageSquare, Award } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const TABS = [
  { id: 'morning', name: 'Утренние мероприятия', icon: Calendar },
  { id: 'field', name: 'Полевые выходы', icon: ClipboardCheck },
  { id: 'oneonone', name: 'One-on-One', icon: Users },
  { id: 'weekly', name: 'Еженедельные показатели', icon: TrendingUp },
  { id: 'newbie', name: 'Адаптация новичков', icon: Award },
  { id: 'plans', name: 'Планы мастеров', icon: Target },
  { id: 'reviews', name: 'Отзывы', icon: MessageSquare },
  { id: 'summary', name: 'Сводка филиала', icon: BarChart3 }
];

// ============= КОМПОНЕНТ ЗВЕЗДНОГО РЕЙТИНГА =============
const StarRating = ({ value, onChange, max = 10 }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          size={20}
          className={`cursor-pointer transition-all ${
            (hover || value) > i ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          }`}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i + 1)}
        />
      ))}
      <span className="ml-2 text-sm font-bold text-slate-600">{value}/{max}</span>
    </div>
  );
};

// ============= ОСНОВНОЕ ПРИЛОЖЕНИЕ =============
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('morning');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(res => res.json())
      .then(data => setBranches(data.branches))
      .catch(err => console.error(err));
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: selectedBranch })
      });
      if (res.ok) {
        setIsLoggedIn(true);
        setStatus('success');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <Users size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">BarberCRM</h1>
            <p className="text-slate-500 font-medium">Система управления филиалами</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">
                Выберите ваш филиал
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium text-slate-900"
              >
                <option value="">-- Выберите филиал --</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleLogin}
              disabled={!selectedBranch}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">BarberCRM</h1>
              <p className="text-sm text-slate-500 font-medium">Филиал: {selectedBranch}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-500" />
            Данные успешно отправлены!
          </div>
        )}

        {activeTab === 'morning' && <MorningEventsTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'field' && <FieldVisitsTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'oneonone' && <OneOnOneTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'weekly' && <WeeklyMetricsTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'newbie' && <NewbieAdaptationTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'plans' && <MasterPlansTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'reviews' && <ReviewsTab branch={selectedBranch} setStatus={setStatus} />}
        {activeTab === 'summary' && <BranchSummaryTab branch={selectedBranch} setStatus={setStatus} />}
      </main>
    </div>
  );
};

// ============= ВКЛАДКА: УТРЕННИЕ МЕРОПРИЯТИЯ =============
const MorningEventsTab = ({ branch, setStatus }) => {
  const [events, setEvents] = useState([
    { id: 1, date: '', event_type: '', participants: 0, efficiency: 5, comment: '' }
  ]);

  const addEvent = () => {
    setEvents([...events, { id: Date.now(), date: '', event_type: '', participants: 0, efficiency: 5, comment: '' }]);
  };

  const updateEvent = (id, field, value) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const data = events.map(e => ({ ...e, branch }));
      const res = await fetch(`${API_URL}/morning-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setEvents([{ id: 1, date: '', event_type: '', participants: 0, efficiency: 5, comment: '' }]);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Утренние мероприятия</h2>
        <button onClick={addEvent} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">
          <Plus size={20} /> Добавить
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
            <button
              onClick={() => removeEvent(event.id)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата</label>
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Тип мероприятия</label>
                <select
                  value={event.event_type}
                  onChange={(e) => updateEvent(event.id, 'event_type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Выберите...</option>
                  <option value="Запуск дня">🚀 Запуск дня</option>
                  <option value="Срез">📊 Срез</option>
                  <option value="Допы">➕ Допы</option>
                  <option value="Улучшения">🔧 Улучшения</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Участники</label>
                <input
                  type="number"
                  value={event.participants}
                  onChange={(e) => updateEvent(event.id, 'participants', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Эффективность</label>
                <select
                  value={event.efficiency}
                  onChange={(e) => updateEvent(event.id, 'efficiency', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Комментарий</label>
                <input
                  placeholder="Итоги..."
                  value={event.comment}
                  onChange={(e) => updateEvent(event.id, 'comment', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: ПОЛЕВЫЕ ВЫХОДЫ =============
const FieldVisitsTab = ({ branch, setStatus }) => {
  const [visits, setVisits] = useState([{
    id: 1,
    date: '',
    master_name: '',
    haircut_quality: 5,
    service_quality: 5,
    additional_services_comment: '',
    additional_services_rating: 5,
    cosmetics_comment: '',
    cosmetics_rating: 5,
    standards_comment: '',
    standards_rating: 5,
    errors_comment: '',
    next_check_date: ''
  }]);

  const addVisit = () => {
    setVisits([...visits, {
      id: Date.now(),
      date: '',
      master_name: '',
      haircut_quality: 5,
      service_quality: 5,
      additional_services_comment: '',
      additional_services_rating: 5,
      cosmetics_comment: '',
      cosmetics_rating: 5,
      standards_comment: '',
      standards_rating: 5,
      errors_comment: '',
      next_check_date: ''
    }]);
  };

  const updateVisit = (id, field, value) => {
    setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVisit = (id) => {
    setVisits(visits.filter(v => v.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const data = visits.map(v => ({ ...v, branch }));
      const res = await fetch(`${API_URL}/field-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setVisits([{
          id: 1, date: '', master_name: '', haircut_quality: 5, service_quality: 5,
          additional_services_comment: '', additional_services_rating: 5,
          cosmetics_comment: '', cosmetics_rating: 5,
          standards_comment: '', standards_rating: 5,
          errors_comment: '', next_check_date: ''
        }]);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Полевые выходы</h2>
        <button onClick={addVisit} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600">
          <Plus size={20} /> Добавить мастера
        </button>
      </div>

      <div className="space-y-6">
        {visits.map((visit) => (
          <div key={visit.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
            <button
              onClick={() => removeVisit(visit.id)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="space-y-6">
              {/* Базовая информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата полевого выхода</label>
                  <input
                    type="date"
                    value={visit.date}
                    onChange={(e) => updateVisit(visit.id, 'date', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Имя мастера</label>
                  <input
                    type="text"
                    value={visit.master_name}
                    onChange={(e) => updateVisit(visit.id, 'master_name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Введите имя мастера"
                  />
                </div>
              </div>

              {/* Оценки */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Качество стрижек</label>
                  <StarRating
                    value={visit.haircut_quality}
                    onChange={(val) => updateVisit(visit.id, 'haircut_quality', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Качество сервиса</label>
                  <StarRating
                    value={visit.service_quality}
                    onChange={(val) => updateVisit(visit.id, 'service_quality', val)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Предложение дополнительных услуг</label>
                  <input
                    type="text"
                    value={visit.additional_services_comment}
                    onChange={(e) => updateVisit(visit.id, 'additional_services_comment', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                    placeholder="Комментарий..."
                  />
                  <StarRating
                    value={visit.additional_services_rating}
                    onChange={(val) => updateVisit(visit.id, 'additional_services_rating', val)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Предложение косметики</label>
                  <input
                    type="text"
                    value={visit.cosmetics_comment}
                    onChange={(e) => updateVisit(visit.id, 'cosmetics_comment', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                    placeholder="Комментарий..."
                  />
                  <StarRating
                    value={visit.cosmetics_rating}
                    onChange={(val) => updateVisit(visit.id, 'cosmetics_rating', val)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Соответствие стандартам компании</label>
                  <input
                    type="text"
                    value={visit.standards_comment}
                    onChange={(e) => updateVisit(visit.id, 'standards_comment', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                    placeholder="Комментарий..."
                  />
                  <StarRating
                    value={visit.standards_rating}
                    onChange={(val) => updateVisit(visit.id, 'standards_rating', val)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выявление ошибок</label>
                  <textarea
                    value={visit.errors_comment}
                    onChange={(e) => updateVisit(visit.id, 'errors_comment', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows="3"
                    placeholder="Описание выявленных ошибок или 'Ошибок не выявлено'"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата следующей проверки</label>
                  <input
                    type="date"
                    value={visit.next_check_date}
                    onChange={(e) => updateVisit(visit.id, 'next_check_date', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Общая оценка */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                <p className="text-xs font-black text-slate-400 uppercase mb-2">Общая оценка (автоматически)</p>
                <p className="text-4xl font-black text-indigo-600">
                  {((visit.haircut_quality + visit.service_quality + visit.additional_services_rating + visit.cosmetics_rating + visit.standards_rating) / 5).toFixed(1)} / 10
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: ONE-ON-ONE ВСТРЕЧИ =============
const OneOnOneTab = ({ branch, setStatus }) => {
  const [meetings, setMeetings] = useState([{
    id: 1,
    date: '',
    master_name: '',
    goal: '',
    results: '',
    development_plan: '',
    indicator: '',
    next_meeting_date: ''
  }]);

  const addMeeting = () => {
    setMeetings([...meetings, {
      id: Date.now(),
      date: '',
      master_name: '',
      goal: '',
      results: '',
      development_plan: '',
      indicator: '',
      next_meeting_date: ''
    }]);
  };

  const updateMeeting = (id, field, value) => {
    setMeetings(meetings.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMeeting = (id) => {
    setMeetings(meetings.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const data = meetings.map(m => ({ ...m, branch }));
      const res = await fetch(`${API_URL}/one-on-one`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setMeetings([{
          id: 1, date: '', master_name: '', goal: '', results: '',
          development_plan: '', indicator: '', next_meeting_date: ''
        }]);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">One-on-One встречи</h2>
        <button onClick={addMeeting} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600">
          <Plus size={20} /> Добавить встречу
        </button>
      </div>

      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
            <button
              onClick={() => removeMeeting(meeting.id)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата встречи</label>
                <input
                  type="date"
                  value={meeting.date}
                  onChange={(e) => updateMeeting(meeting.id, 'date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Имя мастера</label>
                <input
                  type="text"
                  value={meeting.master_name}
                  onChange={(e) => updateMeeting(meeting.id, 'master_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Имя сотрудника"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Цель встречи</label>
                <input
                  type="text"
                  value={meeting.goal}
                  onChange={(e) => updateMeeting(meeting.id, 'goal', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Например: Повышение среднего чека"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Результаты по итогам</label>
                <textarea
                  value={meeting.results}
                  onChange={(e) => updateMeeting(meeting.id, 'results', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows="3"
                  placeholder="Например: Средний чек +200₽"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">План развития до следующей встречи</label>
                <textarea
                  value={meeting.development_plan}
                  onChange={(e) => updateMeeting(meeting.id, 'development_plan', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows="3"
                  placeholder="Например: Приблизиться к плану по допродажам"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Показатель</label>
                <input
                  type="text"
                  value={meeting.indicator}
                  onChange={(e) => updateMeeting(meeting.id, 'indicator', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Например: Средний чек — 1200"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата следующей встречи</label>
                <input
                  type="date"
                  value={meeting.next_meeting_date}
                  onChange={(e) => updateMeeting(meeting.id, 'next_meeting_date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============
const WeeklyMetricsTab = ({ branch, setStatus }) => {
  const [metrics, setMetrics] = useState({
    period: '',
    average_check_plan: 0,
    average_check_fact: 0,
    cosmetics_plan: 0,
    cosmetics_fact: 0,
    additional_services_plan: 0,
    additional_services_fact: 0
  });

  const updateMetric = (field, value) => {
    setMetrics({ ...metrics, [field]: value });
  };

  const calculatePerformance = (fact, plan) => {
    return plan > 0 ? ((fact / plan) * 100).toFixed(1) : 0;
  };

  const handleSubmit = async () => {
    try {
      const data = { ...metrics, branch };
      const res = await fetch(`${API_URL}/weekly-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setMetrics({
          period: '', average_check_plan: 0, average_check_fact: 0,
          cosmetics_plan: 0, cosmetics_fact: 0,
          additional_services_plan: 0, additional_services_fact: 0
        });
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-900">Еженедельные показатели</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-400 uppercase mb-2">Период (неделя)</label>
          <select
            value={metrics.period}
            onChange={(e) => updateMetric('period', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Выберите неделю</option>
            <option value="1-я неделя">1-я неделя</option>
            <option value="2-я неделя">2-я неделя</option>
            <option value="3-я неделя">3-я неделя</option>
            <option value="4-я неделя">4-я неделя</option>
          </select>
        </div>

        <div className="space-y-6">
          {/* Средний чек */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Средний чек</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">План</label>
                <input
                  type="number"
                  value={metrics.average_check_plan}
                  onChange={(e) => updateMetric('average_check_plan', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Факт</label>
                <input
                  type="number"
                  value={metrics.average_check_fact}
                  onChange={(e) => updateMetric('average_check_fact', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                <div className="px-4 py-2.5 bg-white rounded-xl text-2xl font-black text-indigo-600">
                  {calculatePerformance(metrics.average_check_fact, metrics.average_check_plan)}%
                </div>
              </div>
            </div>
          </div>

          {/* Косметика */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Продажи косметики</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">План</label>
                <input
                  type="number"
                  value={metrics.cosmetics_plan}
                  onChange={(e) => updateMetric('cosmetics_plan', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Факт</label>
                <input
                  type="number"
                  value={metrics.cosmetics_fact}
                  onChange={(e) => updateMetric('cosmetics_fact', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                <div className="px-4 py-2.5 bg-white rounded-xl text-2xl font-black text-purple-600">
                  {calculatePerformance(metrics.cosmetics_fact, metrics.cosmetics_plan)}%
                </div>
              </div>
            </div>
          </div>

          {/* Доп. услуги */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Дополнительные услуги</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">План</label>
                <input
                  type="number"
                  value={metrics.additional_services_plan}
                  onChange={(e) => updateMetric('additional_services_plan', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Факт</label>
                <input
                  type="number"
                  value={metrics.additional_services_fact}
                  onChange={(e) => updateMetric('additional_services_fact', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                <div className="px-4 py-2.5 bg-white rounded-xl text-2xl font-black text-amber-600">
                  {calculatePerformance(metrics.additional_services_fact, metrics.additional_services_plan)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: АДАПТАЦИЯ НОВИЧКОВ =============
const NewbieAdaptationTab = ({ branch, setStatus }) => {
  const [newbies, setNewbies] = useState([{
    id: 1,
    start_date: '',
    name: '',
    haircut_practice: 'Не допущен',
    service_standards: 'Не допущен',
    hygiene_sanitation: 'Не допущен',
    additional_services: 'Не допущен',
    cosmetics_sales: 'Не допущен',
    iclient_basics: 'Не допущен',
    status: 'Не выполнено'
  }]);

  const addNewbie = () => {
    setNewbies([...newbies, {
      id: Date.now(),
      start_date: '',
      name: '',
      haircut_practice: 'Не допущен',
      service_standards: 'Не допущен',
      hygiene_sanitation: 'Не допущен',
      additional_services: 'Не допущен',
      cosmetics_sales: 'Не допущен',
      iclient_basics: 'Не допущен',
      status: 'Не выполнено'
    }]);
  };

  const updateNewbie = (id, field, value) => {
    setNewbies(newbies.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const removeNewbie = (id) => {
    setNewbies(newbies.filter(n => n.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const data = newbies.map(n => ({ ...n, branch }));
      const res = await fetch(`${API_URL}/newbie-adaptation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setNewbies([{
          id: 1, start_date: '', name: '',
          haircut_practice: 'Не допущен', service_standards: 'Не допущен',
          hygiene_sanitation: 'Не допущен', additional_services: 'Не допущен',
          cosmetics_sales: 'Не допущен', iclient_basics: 'Не допущен',
          status: 'Не выполнено'
        }]);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const criteriaOptions = ['Не допущен', 'В процессе', 'Допущен'];
  const statusOptions = ['Не выполнено', 'В процессе', 'Выполнено'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Чек-лист адаптации новичка</h2>
        <button onClick={addNewbie} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600">
          <Plus size={20} /> Добавить новичка
        </button>
      </div>

      <div className="space-y-4">
        {newbies.map((newbie) => (
          <div key={newbie.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
            <button
              onClick={() => removeNewbie(newbie.id)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Дата начала адаптации</label>
                <input
                  type="date"
                  value={newbie.start_date}
                  onChange={(e) => updateNewbie(newbie.id, 'start_date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Имя и фамилия</label>
                <input
                  type="text"
                  value={newbie.name}
                  onChange={(e) => updateNewbie(newbie.id, 'name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Введите имя"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-700 text-lg mb-4">Критерии адаптации</h3>
              
              {[
                { field: 'haircut_practice', label: '1. Практика стрижек' },
                { field: 'service_standards', label: '2. Стандарты сервиса' },
                { field: 'hygiene_sanitation', label: '3. Гигиена и санитария' },
                { field: 'additional_services', label: '4. Дополнительные услуги' },
                { field: 'cosmetics_sales', label: '5. Продажа косметики' },
                { field: 'iclient_basics', label: '6. Основы iClient' }
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-700">{label}</span>
                  <select
                    value={newbie[field]}
                    onChange={(e) => updateNewbie(newbie.id, field, e.target.value)}
                    className="px-4 py-2 bg-white border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    {criteriaOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Статус адаптации</label>
                <select
                  value={newbie.status}
                  onChange={(e) => updateNewbie(newbie.id, 'status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: ПЛАНЫ МАСТЕРОВ =============
const MasterPlansTab = ({ branch, setStatus }) => {
  const [plans, setPlans] = useState([{
    id: 1,
    month: '',
    master_name: '',
    average_check_plan: 0,
    average_check_fact: 0,
    additional_services_plan: 0,
    additional_services_fact: 0,
    sales_plan: 0,
    sales_fact: 0,
    salary_plan: 0,
    salary_fact: 0
  }]);

  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const addPlan = () => {
    setPlans([...plans, {
      id: Date.now(),
      month: '',
      master_name: '',
      average_check_plan: 0,
      average_check_fact: 0,
      additional_services_plan: 0,
      additional_services_fact: 0,
      sales_plan: 0,
      sales_fact: 0,
      salary_plan: 0,
      salary_fact: 0
    }]);
  };

  const updatePlan = (id, field, value) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePlan = (id) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const calculatePerformance = (fact, plan) => {
    return plan > 0 ? ((fact / plan) * 100).toFixed(1) : 0;
  };

  const handleSubmit = async () => {
    try {
      const data = plans.map(p => ({ ...p, branch }));
      const res = await fetch(`${API_URL}/master-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setPlans([{
          id: 1, month: '', master_name: '',
          average_check_plan: 0, average_check_fact: 0,
          additional_services_plan: 0, additional_services_fact: 0,
          sales_plan: 0, sales_fact: 0,
          salary_plan: 0, salary_fact: 0
        }]);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Индивидуальные планы мастеров</h2>
        <button onClick={addPlan} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600">
          <Plus size={20} /> Добавить план
        </button>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
            <button
              onClick={() => removePlan(plan.id)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Месяц</label>
                <select
                  value={plan.month}
                  onChange={(e) => updatePlan(plan.id, 'month', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Выберите месяц</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Имя мастера</label>
                <input
                  type="text"
                  value={plan.master_name}
                  onChange={(e) => updatePlan(plan.id, 'master_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Имя мастера"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Средний чек */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Средний чек (план)</label>
                  <input
                    type="number"
                    value={plan.average_check_plan}
                    onChange={(e) => updatePlan(plan.id, 'average_check_plan', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Средний чек (факт)</label>
                  <input
                    type="number"
                    value={plan.average_check_fact}
                    onChange={(e) => updatePlan(plan.id, 'average_check_fact', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                  <div className="px-4 py-2.5 bg-white rounded-xl text-xl font-black text-blue-600">
                    {calculatePerformance(plan.average_check_fact, plan.average_check_plan)}%
                  </div>
                </div>
              </div>

              {/* Доп услуги */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-xl">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Доп. услуги кол-во (план)</label>
                  <input
                    type="number"
                    value={plan.additional_services_plan}
                    onChange={(e) => updatePlan(plan.id, 'additional_services_plan', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Доп. услуги кол-во (факт)</label>
                  <input
                    type="number"
                    value={plan.additional_services_fact}
                    onChange={(e) => updatePlan(plan.id, 'additional_services_fact', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                  <div className="px-4 py-2.5 bg-white rounded-xl text-xl font-black text-purple-600">
                    {calculatePerformance(plan.additional_services_fact, plan.additional_services_plan)}%
                  </div>
                </div>
              </div>

              {/* Объем продаж */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-amber-50 rounded-xl">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Объем продаж ₽ (план)</label>
                  <input
                    type="number"
                    value={plan.sales_plan}
                    onChange={(e) => updatePlan(plan.id, 'sales_plan', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Объем продаж ₽ (факт)</label>
                  <input
                    type="number"
                    value={plan.sales_fact}
                    onChange={(e) => updatePlan(plan.id, 'sales_fact', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                  <div className="px-4 py-2.5 bg-white rounded-xl text-xl font-black text-amber-600">
                    {calculatePerformance(plan.sales_fact, plan.sales_plan)}%
                  </div>
                </div>
              </div>

              {/* Зарплата */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-xl">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Зарплата ₽ (план)</label>
                  <input
                    type="number"
                    value={plan.salary_plan}
                    onChange={(e) => updatePlan(plan.id, 'salary_plan', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Зарплата ₽ (факт)</label>
                  <input
                    type="number"
                    value={plan.salary_fact}
                    onChange={(e) => updatePlan(plan.id, 'salary_fact', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение</label>
                  <div className="px-4 py-2.5 bg-white rounded-xl text-xl font-black text-green-600">
                    {calculatePerformance(plan.salary_fact, plan.salary_plan)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: ОТЗЫВЫ =============
const ReviewsTab = ({ branch, setStatus }) => {
  const [review, setReview] = useState({
    week: '',
    manager_name: '',
    plan: 0,
    fact: 0,
    monthly_target: 0
  });

  const updateReview = (field, value) => {
    setReview({ ...review, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      const data = { ...review, branch };
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setReview({ week: '', manager_name: '', plan: 0, fact: 0, monthly_target: 0 });
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const weekPerformance = review.plan > 0 ? ((review.fact / review.plan) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-900">Отзывы</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Неделя</label>
            <select
              value={review.week}
              onChange={(e) => updateReview('week', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Выберите неделю</option>
              <option value="1-я неделя">1-я неделя</option>
              <option value="2-я неделя">2-я неделя</option>
              <option value="3-я неделя">3-я неделя</option>
              <option value="4-я неделя">4-я неделя</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Имя управляющего</label>
            <input
              type="text"
              value={review.manager_name}
              onChange={(e) => updateReview('manager_name', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Имя управляющего"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">План отзывов</label>
            <input
              type="number"
              value={review.plan}
              onChange={(e) => updateReview('plan', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Факт отзывов</label>
            <input
              type="number"
              value={review.fact}
              onChange={(e) => updateReview('fact', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Выполнение недели</label>
            <div className="px-4 py-2.5 bg-white rounded-xl text-2xl font-black text-indigo-600">
              {weekPerformance}%
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
          <h3 className="font-black text-slate-700 text-lg mb-4">Сводка за месяц</h3>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Целевой показатель за месяц</label>
            <input
              type="number"
              value={review.monthly_target}
              onChange={(e) => updateReview('monthly_target', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Отправить данные
      </button>
    </div>
  );
};

// ============= ВКЛАДКА: СВОДКА ПО ФИЛИАЛУ =============
const BranchSummaryTab = ({ branch, setStatus }) => {
  const [summary, setSummary] = useState({
    manager: '',
    month: '',
    morning_events_goal: 0,
    field_visits_goal: 0,
    one_on_one_goal: 0,
    weekly_reports_goal: 0,
    master_plans_goal: 0,
    reviews_goal: 0,
    new_employees_goal: 0
  });

  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const updateSummary = (field, value) => {
    setSummary({ ...summary, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      const data = { ...summary, branch };
      const res = await fetch(`${API_URL}/branch-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-900">Сводка по филиалу</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Управляющий</label>
            <input
              type="text"
              value={summary.manager}
              onChange={(e) => updateSummary('manager', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Имя и фамилия"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Отчётный месяц</label>
            <select
              value={summary.month}
              onChange={(e) => updateSummary('month', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Выберите месяц</option>
              {months.map(m => <option key={m} value={m}>{m} 2026</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-slate-700 text-lg mb-4">Цели на месяц</h3>
          
          {[
            { field: 'morning_events_goal', label: 'Утренние мероприятия', icon: Calendar },
            { field: 'field_visits_goal', label: 'Полевые выходы', icon: ClipboardCheck },
            { field: 'one_on_one_goal', label: 'One-on-One встречи', icon: Users },
            { field: 'weekly_reports_goal', label: 'Еженедельные отчёты', icon: TrendingUp },
            { field: 'master_plans_goal', label: 'Индивидуальные планы', icon: Target },
            { field: 'reviews_goal', label: 'Отзывы', icon: MessageSquare },
            { field: 'new_employees_goal', label: 'Новые сотрудники', icon: Award }
          ].map(({ field, label, icon: Icon }) => (
            <div key={field} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-indigo-500" />
                <span className="font-bold text-slate-700">{label}</span>
              </div>
              <input
                type="number"
                value={summary[field]}
                onChange={(e) => updateSummary(field, parseInt(e.target.value) || 0)}
                className="w-24 px-4 py-2 bg-white border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <p className="text-sm text-slate-600 mb-2">
            <strong>Важно:</strong> Текущие количества будут подтянуты автоматически из данных предыдущих вкладок.
            Процент выполнения рассчитается автоматически: (Текущее количество / Цель) × 100%
          </p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
      >
        <Send size={24} />
        Сохранить сводку
      </button>
    </div>
  );
};

export default App;
