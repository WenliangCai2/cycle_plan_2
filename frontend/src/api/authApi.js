/**
 * Authentication API Service
 * =======================
 * This module handles all authentication-related API requests including
 * user registration, login, and session management.
 * 
 * Features:
 * - User registration with token management
 * - User login and authentication
 * - Session persistence with localStorage
 * - Automatic token inclusion in API requests
 * - Authentication state checks
 * - User profile information retrieval
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
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

/**
 * Request interceptor to include authentication token
 * 
 * Process:
 * 1. Retrieves token from localStorage if present
 * 2. Adds token to request headers for authentication
 * 3. Handles errors in the request preparation phase
 */
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

/**
 * Response interceptor for unified error handling
 * 
 * Process:
 * 1. Passes successful responses through unmodified
 * 2. Logs and standardizes error handling for failed requests
 */
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
 * 
 * Process:
 * 1. Sends registration credentials to backend
 * 2. Stores authentication data if successful
 * 3. Returns response data or throws standardized error
 * 
 * @param {string} username - Username for new account
 * @param {string} password - Password for new account
 * @returns {Promise} - Promise containing registration result
 */
export const register = async (username, password) => {
  try {
    console.log('Sending registration request:', { username, password: '******' });
    const response = await api.post('/register', { username, password });
    console.log('Registration response:', response.data);
    
    // Save token, userId, and username to localStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', username); // Save username
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error.response?.data || { success: false, message: 'Registration failed, server error' };
  }
};

/**
 * User login
 * 
 * Process:
 * 1. Sends login credentials to backend
 * 2. Stores authentication data if successful
 * 3. Returns response data or throws standardized error
 * 
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} - Promise containing login result
 */
export const login = async (username, password) => {
  try {
    console.log('Sending login request:', { username, password: '******' });
    const response = await api.post('/login', { username, password });
    console.log('Login response:', response.data);
    
    // Save token, userId, and username to localStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', username); // Save username
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error.response?.data || { success: false, message: 'Login failed, server error' };
  }
};

/**
 * Check if user is logged in
 * 
 * Process:
 * 1. Checks if authentication token exists in localStorage
 * 
 * @returns {boolean} - Whether user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get current logged in user ID
 * 
 * Process:
 * 1. Retrieves user ID from localStorage
 * 
 * @returns {string|null} - User ID if available, null otherwise
 */
export const getCurrentUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * User logout
 * 
 * Process:
 * 1. Attempts to notify backend of logout
 * 2. Clears all authentication data from localStorage
 * 3. Returns response or standardized error
 * 
 * @returns {Promise} - Promise containing logout result
 */
export const logout = async () => {
  try {
    const response = await api.post('/logout');
    // Regardless of backend response, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username'); // Also remove username
    return response.data;
  } catch (error) {
    // Even if request fails, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username'); // Also remove username
    throw error.response?.data || { success: false, message: 'Logout failed' };
  }
};

/**
 * Get current username
 * 
 * Process:
 * 1. Retrieves username from localStorage
 * 
 * @returns {string|null} - Username if available, null otherwise
 */
export const getCurrentUsername = () => {
  return localStorage.getItem('username');
};

export default {
  register,
  login,
  isAuthenticated,
  getCurrentUserId,
  logout,
  getCurrentUsername,
};