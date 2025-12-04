// Use Render API URL by default, fallback to localhost for local development
const API_BASE = (import.meta.env.VITE_API_URL || 'https://pitchpilot-api.onrender.com/api').replace(/\/$/, '');

// Log API base URL in development
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE);
}

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Detect network errors more reliably across different browsers and environments
function isNetworkError(error) {
  if (!error) return false;
  
  // Check error name/types
  const errorName = error.name || '';
  const errorMessage = (error.message || '').toLowerCase();
  
  // TypeError is what fetch throws for network errors
  if (errorName === 'TypeError') {
    // Check for common network error message patterns
    const networkPatterns = [
      'fetch',
      'network',
      'connection',
      'failed to fetch',
      'networkerror',
      'network request failed',
      'err_connection_refused',
      'err_connection_reset',
      'err_connection_timed_out',
      'err_network_changed',
      'err_internet_disconnected',
      'the network connection was lost',
      'networkerror when attempting to fetch resource',
      'load failed',
      'cors',
      'refused to connect',
      'could not connect',
      'unable to connect'
    ];
    
    return networkPatterns.some(pattern => errorMessage.includes(pattern));
  }
  
  // Check for other network-related error names
  if (errorName === 'NetworkError' || errorName === 'DOMException') {
    return true;
  }
  
  return false;
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(headers || {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      // If response isn't JSON, use the text as error message
      data = { error: text || 'Invalid response from server' };
    }

    if (!res.ok) {
      // If unauthorized, clear token and redirect to signin
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
          window.location.href = '/signin';
        }
      }
      
      // Extract error message from response
      const errorMessage = data?.message || data?.error || `Request failed (${res.status})`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.body = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors (connection refused, timeout, etc.)
    if (isNetworkError(error)) {
      const networkError = new Error(
        `Cannot connect to server at ${API_BASE}. ` +
        `Please check if the backend is running. ` +
        `For local development, set VITE_API_URL=http://localhost:4000/api in client/.env`
      );
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    // Re-throw other errors
    throw error;
  }
}

// Auth functions
const signup = (payload) => request('/auth/signup', { method: 'POST', body: payload });
const signin = (payload) => request('/auth/signin', { method: 'POST', body: payload });
const getMe = () => request('/auth/me');

// Resume functions
async function uploadResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  
  const token = getToken();
  const url = `${API_BASE}/resume/upload`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      data = { error: text || 'Invalid response from server' };
    }

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
          window.location.href = '/signin';
        }
      }
      const errorMessage = data?.message || data?.error || `Request failed (${res.status})`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.body = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (isNetworkError(error)) {
      const networkError = new Error(
        `Cannot connect to server at ${API_BASE}. ` +
        `Please check if the backend is running. ` +
        `For local development, set VITE_API_URL=http://localhost:4000/api in client/.env`
      );
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

const getResume = () => request('/resume');
const deleteResume = () => request('/resume', { method: 'DELETE' });

const generateEmail = (payload) => request('/emails/generate', { method: 'POST', body: payload });
const sendEmail = (payload) => request('/emails/send', { method: 'POST', body: payload });
const syncReplies = () => request('/emails/sync-replies', { method: 'POST' });
const listLeads = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/leads${query ? `?${query}` : ''}`);
};
const createLead = (payload) => request('/leads', { method: 'POST', body: payload });
const updateLead = (id, payload) => request(`/leads/${id}`, { method: 'PATCH', body: payload });
const listCampaigns = () => request('/campaigns');
const createCampaign = (payload) => request('/campaigns', { method: 'POST', body: payload });
const getCampaign = (id) => request(`/campaigns/${id}`);
const findLeadByEmail = async (email) => {
  if (!email) return null;
  const matches = await listLeads({ email });
  return matches?.[0] || null;
};

export const api = {
  generateEmail,
  sendEmail,
  syncReplies,
  listLeads,
  createLead,
  updateLead,
  listCampaigns,
  createCampaign,
  getCampaign,
  findLeadByEmail
};

export { signup, signin, getMe, uploadResume, getResume, deleteResume };


