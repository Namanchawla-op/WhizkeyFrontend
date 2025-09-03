// src/utils/apiClient.js
import axios from 'axios';
import { API_BASE } from '../setupAxios';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: false,
});

export default api;
export { API_BASE };
