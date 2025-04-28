/**
 * Authentication related API services
 */
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Unified error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API response error:', error);
    return Promise.reject(error);
  }
);

/**
 * User registration
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} - Promise containing registration result
 */
export const register = async (username, password) => {
  try {
    console.log('Sending registration request:', { username, password: '******' });
    const response = await api.post('/register', { username, password });
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error.response?.data || { success: false, message: 'Registration failed, server error' };
  }
};

/**
 * User login
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} - Promise containing login result
 */
export const login = async (username, password) => {
  try {
    console.log('Sending login request:', { username, password: '******' });
    const response = await api.post('/login', { username, password });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error.response?.data || { success: false, message: 'Login failed, server error' };
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} - Whether user is logged in
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get current logged in user ID
 * @returns {string|null} - User ID or null
 */
export const getCurrentUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * User logout
 * @returns {Promise} - Promise containing logout result
 */
export const logout = async () => {
  try {
    const response = await api.post('/logout');
    // Regardless of backend response, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return response.data;
  } catch (error) {
    // Even if request fails, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    throw error.response?.data || { success: false, message: 'Logout failed' };
  }
};

export default {
  register,
  login,
  isAuthenticated,
  getCurrentUserId,
  logout,
}; 