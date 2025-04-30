/**
 * Vote related API services
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
 * Create or update a vote for a route
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