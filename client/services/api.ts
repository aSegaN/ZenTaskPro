import axios from 'axios';
import { AuthSession } from '../types';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
    const sessionStr = localStorage.getItem('zentask_session');
    if (sessionStr) {
        const session: AuthSession = JSON.parse(sessionStr);
        config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
});

export default api;