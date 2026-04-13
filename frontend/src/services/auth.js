import api from './api';

export const login = async (login, password) => {
  const response = await api.post('/auth', { login, password });
  const { access_token } = response.data;
  localStorage.setItem('token', access_token);
  localStorage.setItem('username', login);
  return access_token;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export const getCurrentUsername = () => {
  return localStorage.getItem('username');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
