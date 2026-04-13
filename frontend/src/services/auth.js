import api from './api';

export const login = async (login, password) => {
  const response = await api.post('/auth', { login, password });
  const { access_token } = response.data;
  localStorage.setItem('token', access_token);
  return access_token;
};

export const getMe = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
