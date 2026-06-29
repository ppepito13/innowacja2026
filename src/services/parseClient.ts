import axios from 'axios';
import { SESSION_TOKEN_KEY } from './parseService';

const parseClient = axios.create({
    baseURL: '/parse',
    headers: {
        'X-Parse-Application-Id': process.env.REACT_APP_PARSE_APP_ID || '',
        'X-Parse-REST-API-Key': process.env.REACT_APP_PARSE_REST_KEY || '',
        'Content-Type': 'application/json',
    },
});

// Interceptor — dołącza token sesji jeśli użytkownik jest zalogowany
parseClient.interceptors.request.use((config) => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) {
        config.headers['X-Parse-Session-Token'] = sessionToken;
    }
    return config;
});

// Response interceptor — czyści zły/przedawniony token przy błędzie 209
parseClient.interceptors.response.use(
  (response) => response,
  (error) => {
      if (error?.response?.data?.code === 209) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          // powiadom AuthProvider, żeby zresetował usera
          window.dispatchEvent(new Event('auth:session-invalid'));
      }
      return Promise.reject(error);
  },
);

export default parseClient;
