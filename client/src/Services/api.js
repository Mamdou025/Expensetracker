// src/services/api.js - Base API configuration
const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocalReactDevServer =
      ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
      window.location.port === '3000';

    if (isLocalReactDevServer) {
      return 'http://localhost:5000';
    }
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

  if (!response.ok) {
    const message = data.error || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export const apiClient = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return handleResponse(response);
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint, data = null) => {
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return handleResponse(response);
  },
};

