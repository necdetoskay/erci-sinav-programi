import axios from 'axios';
import { refreshAccessToken } from './auth.service';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  // Add timeout to prevent hanging requests
  timeout: 10000
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // For debugging
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error scenarios
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('API Error:', error.message, error.code, error.response?.status);
    
    const originalRequest = error.config;
    
    // Handle authentication errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken);
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 