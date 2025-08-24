// src/utils/api.js
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://ec2-13-60-104-32.eu-north-1.compute.amazonaws.com:3001";

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Optional: set/remove auth token on the instance
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Export default too, so both default and named imports work
export default api;
