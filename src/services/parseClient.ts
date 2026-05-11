import axios from 'axios';

const parseClient = axios.create({
    baseURL: process.env.REACT_APP_PARSE_SERVER_URL || 'http://192.168.66.24:1337/parse',
    headers: {
        'X-Parse-Application-Id': process.env.REACT_APP_PARSE_APP_ID || '',
        'X-Parse-REST-API-Key': process.env.REACT_APP_PARSE_REST_KEY || '',
        'Content-Type': 'application/json',
    },
});

// Interceptor — dołącza token sesji jeśli użytkownik jest zalogowany
parseClient.interceptors.request.use((config) => {
    const sessionToken = localStorage.getItem('parseSessionToken');
    if (sessionToken) {
        config.headers['X-Parse-Session-Token'] = sessionToken;
    }
    return config;
});

export default parseClient;
