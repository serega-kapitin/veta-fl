import api from './api';

export const getFlowers = async (sold = false) => {
  const params = sold ? { sold: true } : {};
  const response = await api.get('/flowers', { params });
  return response.data;
};

export const createFlower = async (data) => {
  const response = await api.post('/flowers', data);
  return response.data;
};

export const updateFlower = async (id, data) => {
  const response = await api.put(`/flowers/${id}`, data);
  return response.data;
};

export const sellFlower = async (id, sellPrice) => {
  const response = await api.post(`/flowers/${id}/sell`, { sell_price: sellPrice });
  return response.data;
};

export const updateFlowerPhoto = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.put(`/flowers/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteFlower = async (id) => {
  await api.delete(`/flowers/${id}`);
};
