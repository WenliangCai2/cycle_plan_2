/**
 * Review related API services
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
 * Create or update a review for a route
 * @param {string} routeId - Route ID
 * @param {Object} review - Review data
 * @param {string} review.content - Review content
 * @param {number} review.rating - Rating (1-5)
 * @returns {Promise} - Promise containing creation result
 */
export const createReview = async (routeId, review) => {
  try {
    const response = await api.post(`/reviews/routes/${routeId}`, review);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create review' };
  }
};

/**
 * Get reviews for a route
 * @param {string} routeId - Route ID
 * @param {number} page - Page number
 * @param {number} limit - Number of reviews per page
 * @returns {Promise} - Promise containing list of reviews
 */
export const getReviews = async (routeId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/reviews/routes/${routeId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get reviews' };
  }
};

/**
 * Delete a review
 * @param {string} routeId - Route ID
 * @param {string} reviewId - Review ID
 * @returns {Promise} - Promise containing deletion result
 */
export const deleteReview = async (routeId, reviewId) => {
  try {
    const response = await api.delete(`/reviews/routes/${routeId}/${reviewId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete review' };
  }
};

export default {
  createReview,
  getReviews,
  deleteReview,
}; 