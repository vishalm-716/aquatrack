import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('aquatrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aquatrack_token');
      localStorage.removeItem('aquatrack_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Surveys
export const getSurveys = (params) => API.get('/surveys', { params });
export const getSurveyById = (id) => API.get(`/surveys/${id}`);
export const createSurvey = (data) => {
  return API.post('/surveys', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateSurvey = (id, data) => {
  return API.put(`/surveys/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteSurvey = (id) => API.delete(`/surveys/${id}`);

// Species
export const getSpecies = (params) => API.get('/species', { params });
export const createSpecies = (data) => API.post('/species', data);

// Restoration
export const getRestorations = (params) => API.get('/restoration', { params });
export const createRestoration = (data) => {
  return API.post('/restoration', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateRestoration = (id, data) => {
  return API.put(`/restoration/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Dashboard
export const getDashboardSummary = () => API.get('/dashboard/summary');

// Admin
export const getUsers = () => API.get('/admin/users');
export const updateUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

export default API;
