/**
 * Custom Point API Service
 * ====================
 * This module handles all custom point-related API requests,
 * allowing users to create and manage custom points of interest
 * on cycling routes.
 * 
 * Features:
 * - Retrieve user's custom points
 * - Create new custom points with geographic coordinates
 * - Legacy support for point deletion (now handled elsewhere)
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
  // Make all requests non-simple requests to trigger browser's CORS preflight request
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
 * Get all custom points for a user
 * 
 * Process:
 * 1. Retrieves all custom points associated with authenticated user
 * 2. Returns points data or standardized error
 * 
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
 * 
 * Process:
 * 1. Sends point data including name and coordinates to backend
 * 2. Associates point with current authenticated user
 * 
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
 * DEPRECATED: Delete a custom point
 * 
 * This function is no longer used - the delete operation is now handled
 * directly in the RestaurantList component using fetch API for better
 * reliability.
 * 
 * @param {string} pointId - Point ID
 * @returns {Promise} - Promise containing deprecation message
 */
export const deleteCustomPoint = async (pointId) => {
  console.log(`This function is deprecated and should not be called.`);
  console.log(`The deletion is now handled directly in the RestaurantList component.`);
  return { success: false, message: 'This function is deprecated' };
};

export default {
  getCustomPoints,
  createCustomPoint,
  deleteCustomPoint,
};