const isLocal = window.location.hostname === 'localhost';

export const BASE_URL = isLocal ? 'http://localhost:5000' : 'https://luminabi.onrender.com';

export const API_URL = `${BASE_URL}/api`;
export const QUERY_URL = `${API_URL}/query`;
export const DATASETS_URL = `${API_URL}/datasets`;
export const AUTH_URL = `${API_URL}/auth`;

