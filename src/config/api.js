// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Client
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this._token = localStorage.getItem('token');
  }

  get token() {
    return this._token ?? localStorage.getItem('token');
  }

  setToken(token) {
    this._token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(data.token);
    return data;
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updatePreferences(preferences) {
    return this.request('/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  logout() {
    this.setToken(null);
  }

  async getBillingStatus() {
    return this.request('/billing/status');
  }

  async createCheckoutSession() {
    return this.request('/billing/checkout', { method: 'POST' });
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async updateAdminUser(userId, body) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Shops
  async getShops() {
    return this.request('/shops');
  }

  async getShop(shopId) {
    return this.request(`/shops/${shopId}`);
  }

  async getConnectUrl() {
    return this.request('/shops/connect/url');
  }

  async connectShop(data) {
    return this.request('/shops/connect', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async refreshShopMetrics(shopId) {
    return this.request(`/shops/${shopId}/refresh`, {
      method: 'POST'
    });
  }

  async updateShop(shopId, data) {
    return this.request(`/shops/${shopId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteShop(shopId) {
    return this.request(`/shops/${shopId}`, {
      method: 'DELETE'
    });
  }

  // Metrics
  async getCurrentMetrics(shopId) {
    return this.request(`/metrics/${shopId}/current`);
  }

  async getMetricsHistory(shopId, period = '7d') {
    return this.request(`/metrics/${shopId}/history?period=${period}`);
  }

  async getMetricsSummary() {
    return this.request('/metrics/summary');
  }

  // Alerts
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alerts${query ? '?' + query : ''}`);
  }

  async getAlert(alertId) {
    return this.request(`/alerts/${alertId}`);
  }

  async dismissAlert(alertId) {
    return this.request(`/alerts/${alertId}/dismiss`, {
      method: 'PATCH'
    });
  }

  async resolveAlert(alertId) {
    return this.request(`/alerts/${alertId}/resolve`, {
      method: 'PATCH'
    });
  }

  async getAlertStats(period = '7d') {
    return this.request(`/alerts/stats/summary?period=${period}`);
  }

  // Appeals
  async getAppeals(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appeals${query ? '?' + query : ''}`);
  }

  async generateAppeal(data) {
    return this.request('/appeals/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async submitAppeal(appealId) {
    return this.request(`/appeals/${appealId}/submit`, {
      method: 'POST'
    });
  }

  async updateAppeal(appealId, data) {
    return this.request(`/appeals/${appealId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteAppeal(appealId) {
    return this.request(`/appeals/${appealId}`, {
      method: 'DELETE'
    });
  }

  // Compliance
  async scanCompliance(text, productData = {}) {
    return this.request('/compliance/scan', {
      method: 'POST',
      body: JSON.stringify({ text, productData })
    });
  }

  async scanComplianceBatch(products) {
    return this.request('/compliance/scan/batch', {
      method: 'POST',
      body: JSON.stringify({ products })
    });
  }

  async getComplianceRules() {
    return this.request('/compliance/rules');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export default api;
