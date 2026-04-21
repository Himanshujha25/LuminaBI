const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const isLocal = localHosts.has(window.location.hostname);

export const BASE_URL = isLocal ? '' : 'https://luminabi.onrender.com';
export const HEALTH_URL = isLocal ? '/health' : `${BASE_URL}/health`;

export const API_URL = `${BASE_URL}/api`;
export const QUERY_URL = `${API_URL}/query`;
export const DATASETS_URL = `${API_URL}/datasets`;
export const AUTH_URL = `${API_URL}/auth`;
