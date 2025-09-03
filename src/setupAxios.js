// src/setupAxios.js
import axios from 'axios';

// Works on EC2 and locally. You can override with REACT_APP_API_URL.
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window?.location?.hostname
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001');

// Apply globally so ALL existing axios calls go to your backend.
axios.defaults.baseURL = API_BASE;
axios.defaults.timeout = 15000;

export { API_BASE };
