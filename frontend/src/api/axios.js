import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('legalmind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('legalmind_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

// ===== DOCUMENTS =====
export const documentsAPI = {
  getAll: () => api.get('/document'), // (Ye abhi banai nahi Node me, isko rehnede)
  upload: (file, onProgress) => {
    const formData = new FormData();
    // dhyan dena yahan 'pdfFile' hi likhna hai kyuki node.js ka multer isi naam se wait kar raha hai
    formData.append('pdfFile', file); 
    return api.post('/document/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
};

// ===== QUERY / CHAT =====
export const queryAPI = {
  ask: (documentId, question) => api.post('/document/query', { document_id: documentId, user_query: question }),
};

// ===== RISK ANALYSIS =====
export const riskAPI = {
  // Purna "/analyze" route galat tha jo 404 deta h
  // Ise "/document/analyze-risk" ya "/ai/analyze-risk" karo jo tumne APIGateway(Node.js) me likhi h!
  analyze: (documentId) => api.post('/document/analyze-risk', { document_id: documentId }),
  getReport: (reportId) => api.get(`/risk/report/${reportId}`),
};

// ===== SUMMARY =====
export const summaryAPI = {
  generate: (documentId) => api.post('/document/summary', { document_id: documentId }),
};

export default api;
