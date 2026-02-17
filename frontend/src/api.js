import axios from 'axios';

// ============================================================
// 1. CONFIGURATION
// ============================================================
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// 2. INTERCEPTORS
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// ============================================================
// 3. API FUNCTIONS
// ============================================================

// --- AUTH ---
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const addGatekeeper = (data) => api.post('/auth/add-gatekeeper', data);
export const getGatekeepers = () => api.get('/auth/gatekeepers');

// --- EVENTS ---
export const getEvents = () => api.get('/events');
export const createEvent = (data) => api.post('/events', data);
export const joinEvent = (data) => api.post('/events/join', data);
export const getGatekeeperEvents = () => api.get('/events/gatekeeper-view');

// --- TICKETS ---
export const bookTicket = (data) => api.post('/ticket/book', data);
export const verifyTicket = (data) => api.post('/ticket/verify', data);

// --- TEAMS ---
export const getMyTeam = () => api.get('/teams/my-team');
export const createTeam = (data) => api.post('/teams/create', data);
export const joinTeam = (data) => api.post('/teams/join', data);
export const leaveTeam = (data) => api.post('/teams/leave', data);
export const removeMember = (data) => api.post('/teams/remove-member', data);
export const deleteTeam = (data) => api.delete('/teams/delete', { data }); 

// --- FINDER ---
export const getFinderUsers = () => api.get('/finder/users');
export const sendInvite = (data) => api.post('/finder/invite', data);
export const getMyRequests = () => api.get('/finder/my-requests');
export const handleRequest = (data) => api.post('/finder/handle', data);
export const updateProfile = (data) => api.put('/finder/profile', data);

// --- 🔥 CHAT (New Section) ---
export const getMyConversations = () => api.get('/chat/inbox'); 

// --- CERTIFICATES ---
export const issueCertificate = (data) => api.post('/certificate/issue', data);
export const issueAllCertificates = (data) => api.post('/certificate/issue-all', data);
export const verifyCertificate = (certId) => api.get(`/certificate/verify/${certId}`);

// --- ANALYTICS ---
export const getStats = (eventId) => api.get(`/analytics/stats?eventId=${eventId || ''}`);
export const sendAnalyticsEmail = (data) => api.post('/analytics/send-report', data);
export const downloadAnalyticsReport = (eventId) => 
  api.get(`/analytics/download-report?eventId=${eventId}`, { responseType: 'blob' });

export default api;