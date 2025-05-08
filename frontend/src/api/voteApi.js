/**
 * Vote API Service
 * =============
 * This module handles all vote-related API requests including
 * creating, updating, and retrieving votes for cycling routes.
 * 
 * Features:
 * - Create and update votes (upvotes/downvotes)
 * - Remove votes by toggling the same vote type
 * - Retrieve vote statistics for routes
 * 
 * Author: Zhuoyi Zhang
 * Contributors: [Contributors Names]
 * Last Modified: 07/05/2025
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
 * Create or update a vote for a route
 * 
 * Process:
 * 1. Sends vote type to backend (1 for upvote, -1 for downvote)
 * 2. Handles toggling behavior (clicking same vote type removes it)
 * 3. Returns updated vote statistics
 * 
 * @param {string} routeId - Route ID
 * @param {number} voteType - Vote type (1 for upvote, -1 for downvote)
 * @returns {Promise} - Promise containing creation result
 */
export const createOrUpdateVote = async (routeId, voteType) => {
  try {
    const response = await api.post(`/votes/routes/${routeId}`, { vote_type: voteType });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create vote' };
  }
};

/**
 * Get votes for a route
 * 
 * Process:
 * 1. Retrieves vote statistics for a specific route
 * 2. Returns upvotes, downvotes, score, and user's vote
 * 
 * @param {string} routeId - Route ID
 * @returns {Promise} - Promise containing vote statistics
 */
export const getRouteVotes = async (routeId) => {
  try {
    const response = await api.get(`/votes/routes/${routeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get votes' };
  }
};

export default {
  createOrUpdateVote,
  getRouteVotes,
};