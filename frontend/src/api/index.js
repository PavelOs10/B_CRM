import { API_BASE_URL } from './config.js';

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
  },

  // Авторизация
  async login(name, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
  },

  async register(branchData) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  },

  // Дашборд
  async getDashboardSummary(branchName) {
    return this.request(`/dashboard-summary/${branchName}`);
  },

  // Утренние мероприятия
  async submitMorningEvents(branchName, events) {
    return this.request(`/morning-events/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(events),
    });
  },

  async getMorningEvents(branchName) {
    return this.request(`/morning-events/${branchName}`);
  },

  // Полевые выходы
  async submitFieldVisits(branchName, visits) {
    return this.request(`/field-visits/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(visits),
    });
  },

  async getFieldVisits(branchName) {
    return this.request(`/field-visits/${branchName}`);
  },

  // One-on-One
  async submitOneOnOne(branchName, meetings) {
    return this.request(`/one-on-one/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(meetings),
    });
  },

  async getOneOnOne(branchName) {
    return this.request(`/one-on-one/${branchName}`);
  },

  // Еженедельные показатели
  async submitWeeklyMetrics(branchName, metrics) {
    return this.request(`/weekly-metrics/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(metrics),
    });
  },

  async getWeeklyMetrics(branchName) {
    return this.request(`/weekly-metrics/${branchName}`);
  },

  // Адаптация новичков
  async submitNewbieAdaptation(branchName, adaptations) {
    return this.request(`/newbie-adaptation/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(adaptations),
    });
  },

  async getNewbieAdaptation(branchName) {
    return this.request(`/newbie-adaptation/${branchName}`);
  },

  // Планы мастеров
  async submitMasterPlans(branchName, plans) {
    return this.request(`/master-plans/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(plans),
    });
  },

  async getMasterPlans(branchName) {
    return this.request(`/master-plans/${branchName}`);
  },

  // Отзывы
  async submitReviews(branchName, review) {
    return this.request(`/reviews/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },

  async getReviews(branchName) {
    return this.request(`/reviews/${branchName}`);
  },

  // Сводка
  async submitBranchSummary(branchName, summary) {
    return this.request(`/branch-summary/${branchName}`, {
      method: 'POST',
      body: JSON.stringify(summary),
    });
  },

  async getBranchSummary(branchName) {
    return this.request(`/branch-summary/${branchName}`);
  },
};

export default api;
