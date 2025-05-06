/**
 * Review API Service
 * ===============
 * This module handles all review-related API requests including
 * creating, retrieving, and managing reviews for cycling routes.
 * 
 * Features:
 * - Create and update reviews with ratings
 * - Retrieve reviews with pagination
 * - Delete reviews with proper authorization
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
 * Create or update a review for a route
 * 
 * Process:
 * 1. Sends review content and rating to backend
 * 2. Handles updating existing review if user has already reviewed
 * 
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
 * 
 * Process:
 * 1. Retrieves reviews with pagination parameters
 * 2. Returns formatted review list with user information
 * 
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
 * 
 * Process:
 * 1. Sends delete request to the backend
 * 2. Handles authentication and authorization through interceptor
 * 
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