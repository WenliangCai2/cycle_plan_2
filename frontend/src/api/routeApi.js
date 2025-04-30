/**
 * Route related API services
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
 * Get all routes for a user
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
 * Delete a route
 * @param {string} routeId - Route ID
 * @returns {Promise} - Promise containing deletion result
 */
export const deleteRoute = async (routeId) => {
  console.log(`This function is deprecated and should not be called.`);
  console.log(`The deletion is now handled directly in the App component using fetch API.`);
  return { success: false, message: 'This function is deprecated' };
};

/**
 * Share a route to social media
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
}; 