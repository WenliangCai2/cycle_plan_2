/**
 * Custom point related API services
 */
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // Make all requests non-simple requests to trigger browser's CORS preflight request
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
 * Get all custom points for a user
 * @returns {Promise} - Promise containing list of custom points
 */
export const getCustomPoints = async () => {
  try {
    const response = await api.get('/custom-points');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get custom points' };
  }
};

/**
 * Create a new custom point
 * @param {Object} point - Point information
 * @param {string} point.name - Point name
 * @param {Object} point.location - Point location
 * @param {number} point.location.lat - Latitude
 * @param {number} point.location.lng - Longitude
 * @returns {Promise} - Promise containing creation result
 */
export const createCustomPoint = async (point) => {
  try {
    const response = await api.post('/custom-points', { point });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create custom point' };
  }
};

/**
 * Delete a custom point
 * @param {string} pointId - Point ID
 * @returns {Promise} - Promise containing deletion result
 */
export const deleteCustomPoint = async (pointId) => {
  try {
    const response = await api.delete(`/custom-points/${pointId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete custom point' };
  }
};

export default {
  getCustomPoints,
  createCustomPoint,
  deleteCustomPoint,
}; 