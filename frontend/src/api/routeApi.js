/**
 * Route API Service
 * ==============
 * This module handles all route-related API requests including
 * creating, retrieving, sharing, and managing cycling routes.
 * 
 * Features:
 * - Upload route images
 * - Create new cycling routes with waypoints
 * - Retrieve user's routes
 * - Share routes to social media
 * - Update route visibility settings
 * - Browse public routes with filtering and pagination
 * - Get detailed route information
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
 * Upload a route image
 * 
 * Process:
 * 1. Creates FormData object and appends file
 * 2. Sends specialized request with multipart content type
 * 3. Includes authentication token in headers
 * 
 * @param {File} file - Image file to upload
 * @returns {Promise} - Promise containing upload result
 */
export const uploadRouteImage = async (file) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Use axios directly with specific content type for file upload
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token || ''
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to upload image' };
  }
};

/**
 * Get all routes for a user
 * 
 * Process:
 * 1. Retrieves all routes associated with authenticated user
 * 2. Returns routes data or standardized error
 * 
 * @returns {Promise} - Promise containing list of routes
 */
export const getRoutes = async () => {
  try {
    const response = await api.get('/routes/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get routes' };
  }
};

/**
 * Create a new route
 * 
 * Process:
 * 1. Sends route data including name, locations, and visibility
 * 2. Associates route with current authenticated user
 * 
 * @param {Object} route - Route information
 * @param {string} route.name - Route name
 * @param {Array} route.locations - Locations included in the route
 * @param {boolean} route.is_public - Whether route is publicly shared
 * @returns {Promise} - Promise containing creation result
 */
export const createRoute = async (route) => {
  try {
    const response = await api.post('/routes/', { route });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create route' };
  }
};

/**
 * DEPRECATED: Delete a route
 * 
 * This function is no longer used - the delete operation is now handled
 * directly in the App component using fetch API for better reliability.
 * 
 * @param {string} routeId - Route ID
 * @returns {Promise} - Promise containing deprecation message
 */
export const deleteRoute = async (routeId) => {
  console.log(`This function is deprecated and should not be called.`);
  console.log(`The deletion is now handled directly in the App component using fetch API.`);
  return { success: false, message: 'This function is deprecated' };
};

/**
 * Share a route to social media
 * 
 * Process:
 * 1. Sends share request to backend
 * 2. Returns sharing links for various social platforms
 * 
 * @param {string} routeId - Route ID
 * @returns {Promise} - Promise containing share links
 */
export const shareRoute = async (routeId) => {
  try {
    const response = await api.post(`/routes/${routeId}/share`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to share route' };
  }
};

/**
 * Update route visibility (public/private)
 * 
 * Process:
 * 1. Sends visibility update request to backend
 * 2. Changes whether route is publicly visible
 * 
 * @param {string} routeId - Route ID
 * @param {boolean} isPublic - Whether route should be public
 * @returns {Promise} - Promise containing update result
 */
export const updateRouteVisibility = async (routeId, isPublic) => {
  try {
    const response = await api.put(`/routes/${routeId}/visibility`, { is_public: isPublic });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update visibility' };
  }
};

/**
 * Get all public routes
 * 
 * Process:
 * 1. Retrieves public routes with pagination and sorting parameters
 * 2. Returns formatted list of routes with metadata
 * 
 * @param {number} page - Page number
 * @param {number} limit - Number of routes per page
 * @param {string} sortBy - Field to sort by (default: 'vote_score')
 * @param {string} sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @returns {Promise} - Promise containing list of public routes
 */
export const getPublicRoutes = async (page = 1, limit = 20, sortBy = 'vote_score', sortOrder = 'desc') => {
  try {
    const response = await api.get(`/routes/public?page=${page}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get public routes' };
  }
};

/**
 * Get a specific route by ID
 * 
 * Process:
 * 1. Retrieves detailed information for a specific route
 * 2. Handles permission checks for private routes on the backend
 * 
 * @param {string} routeId - Route ID
 * @returns {Promise} - Promise containing route details
 */
export const getRouteById = async (routeId) => {
  try {
    const response = await api.get(`/routes/${routeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get route' };
  }
};

export default {
  getRoutes,
  createRoute,
  deleteRoute,
  shareRoute,
  updateRouteVisibility,
  getPublicRoutes,
  getRouteById,
  uploadRouteImage,
};