/**
 * User related API services
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
    return Promise.reject(error);
  }
);

/**
 * Get username by user ID
 * @param {string} userId - User ID
 * @returns {Promise} - Promise containing username
 */
export const getUsernameById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get username:', error);
    // As a fallback, if the userId matches current user,
    // return the stored username
    if (userId === localStorage.getItem('userId')) {
      return { 
        success: true, 
        username: localStorage.getItem('username') || 'You' 
      };
    }
    throw error.response?.data || { success: false, message: 'Failed to get username' };
  }
};

/**
 * Get current user profile
 * @returns {Promise} - Promise containing user profile
 */
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get user profile' };
  }
};

export default {
  getUsernameById,
  getCurrentUserProfile,
}; 