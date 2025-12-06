import axios from 'axios';

// Backend API URL - Using local network IP for mobile connectivity
// Your computer's IP: 192.168.1.32
const API_URL = 'http://40.192.15.217:5000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Auth API
export const authAPI = {
    login: (name: string, role: 'user' | 'admin', password: string) =>
        api.post('/api/user/login', { name, role, password }),
};

// User API
export const userAPI = {
    getUsers: () => api.get('/api/users'),
    getUser: (userName: string) => api.get(`/api/user/${userName}`),
    updateUser: (data: {
        name: string;
        role: string;
        phoneNumber?: string;
        password: string;
        reportingManagerEmail?: string;
        profilePic?: string;
    }) => api.post('/api/user/update', data),
    deleteUser: (userName: string) => api.post('/api/user/delete', { userName }),
};

// Visits API
export const visitsAPI = {
    getVisits: (params?: { userName?: string; fromDate?: string; toDate?: string }) =>
        api.get('/api/visits', { params }),
    getPendingCheckouts: () => api.get('/api/visits/pending-checkouts'),
    createVisit: (data: {
        userName: string;
        clientName: string;
        companyName: string;
        checkInAddress: string;
        checkInMapLink?: string;
    }) => api.post('/api/visits/create', data),
    updateVisit: (data: {
        id: number;
        checkOutAddress: string;
        checkOutMapLink?: string;
        locationMismatch: boolean;
    }) => api.post('/api/visits/update', data),
    deleteVisit: (id: number) => api.post('/api/visits/delete', { id }),
};

// Clients API
export const clientsAPI = {
    getClients: () => api.get('/api/clients'),
    createClient: (data: { name: string; company: string; location: string }) =>
        api.post('/api/clients/create', data),
    deleteClient: (name: string) => api.post('/api/clients/delete', { name }),
};

// Settings API
export const settingsAPI = {
    getSetting: (key: string) => api.get(`/api/settings/${key}`),
    updateSetting: (key: string, value: string) =>
        api.post('/api/settings', { key, value }),
};

// Geocoding API
export const geocodingAPI = {
    reverseGeocode: (lat: number, lng: number) =>
        api.get(`/api/geocode?lat=${lat}&lng=${lng}`),
    forwardGeocode: (address: string) =>
        api.get(`/api/geocode-forward?address=${encodeURIComponent(address)}`),
};

// Reports API
export const reportsAPI = {
    sendReport: (data: {
        userName: string;
        userRole: string;
        visits: any[];
        fromDate?: string;
        toDate?: string;
        recipientEmail?: string;
    }) => api.post('/api/send-report', data),
};

export default api;
