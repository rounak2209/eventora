import axios from 'axios';

// ============================================================
// 1. CONFIGURATION
// ============================================================
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
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

// 🔥 NEW: Gatekeeper Update & Delete APIs
export const updateGatekeeper = (id, data) => api.put(`/auth/gatekeeper/${id}`, data);
export const deleteGatekeeper = (id) => api.delete(`/auth/gatekeeper/${id}`);

// 🔥 YE RAHI NAYI LINE: Password update ke liye
export const updatePassword = (data) => api.put('/auth/update-password', data);

// --- EVENTS ---
export const getEvents = () => api.get('/events');

// 🔥 NEW LINE ADDED HERE: Organizer ko sirf uske apne events dikhane ke liye
export const getOrganizerEvents = () => api.get('/events/my-events');

// 🔥 EXPERT FIX: Removed manual 'multipart/form-data'. 
// FormData khud automatically sahi headers lagata hai boundary ke sath!
export const createEvent = (data) => api.post('/events', data, {
    // Ye line assure karti hai ki default JSON header is file upload ko kharab na kare
    transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
    }]
});

// 🔥 NEW: Event Delete & Update APIs (Manage Section ke liye)
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);

// 🔥 FIX ADDED HERE: Update me bhi FormData fix lagaya taaki 500 error na aaye
export const updateEvent = (eventId, data) => api.put(`/events/${eventId}`, data, {
    transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
    }]
});

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
export const getChatHistory = (recipientId, isGroup) => api.get(`/chat/history/${recipientId}?isGroup=${isGroup}`);

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