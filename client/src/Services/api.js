// src/services/api.js - Base API configuration
const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const isLocalReactDevServer =
      ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
      window.location.port === '3000';
    if (isLocalReactDevServer) return 'http://localhost:5000';
  }
  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const handleResponse = async (response) => {
  let data = {};
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (response.status === 401) {
    // Notify listeners (e.g., AuthContext) so the UI can flip to the landing page.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:unauthorized'));
    }
    const err = new Error(data.error || data.message || 'Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const message = data.error || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }
  return data;
};

const fetchWithCreds = (url, opts = {}) => fetch(url, { credentials: 'include', ...opts });

export const apiClient = {
  get: async (endpoint) => handleResponse(await fetchWithCreds(`${API_BASE_URL}${endpoint}`)),
  post: async (endpoint, data) => handleResponse(await fetchWithCreds(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })),
  put: async (endpoint, data) => handleResponse(await fetchWithCreds(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })),
  upload: async (endpoint, formData) => handleResponse(await fetchWithCreds(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  })),
  delete: async (endpoint, data = null) => {
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);
    return handleResponse(await fetchWithCreds(`${API_BASE_URL}${endpoint}`, options));
  },
};
