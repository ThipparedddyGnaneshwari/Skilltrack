import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !e.config.url.includes('/auth/')) {
    localStorage.clear(); sessionStorage.clear(); window.location.assign('/login');
  }
  return Promise.reject(e);
});

export const errMsg = (e) =>
  !e.response ? 'Unable to connect to the server. Please make sure the Flask backend is running on port 5000.' : e.response.data?.error || 'Something went wrong.';
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const traineeCode = (id) => `ST-${10000 + id}`;
