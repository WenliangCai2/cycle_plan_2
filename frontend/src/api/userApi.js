/**
 * User API Service
 * =============
 * This module handles all user-related API requests including
 * retrieving user profiles and looking up usernames.
 * 
 * Features:
 * - Get username by user ID
 * - Retrieve current user's profile
 * - Fallback to localStorage for username retrieval
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
    return Promise.reject(error);
  }
);

/**
 * Get username by user ID
 * 
 * Process:
 * 1. Requests user information from the backend by ID
 * 2. Provides fallback to localStorage for current user
 * 3. Returns username or standardized error
 * 
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
 * 
 * Process:
 * 1. Retrieves profile information for authenticated user
 * 2. Requires valid authentication token in request
 * 
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