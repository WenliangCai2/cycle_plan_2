/**
 * Comment related API services
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
 * Upload a file (image or video)
 * @param {File} file - The file to upload
 * @returns {Promise} - Promise containing the upload result
 */
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': localStorage.getItem('token')
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to upload file' };
  }
};

/**
 * Create a new comment or reply
 * @param {string} routeId - Route ID
 * @param {Object} comment - Comment data
 * @param {string} comment.content - Comment content
 * @param {Array} [comment.media_urls] - List of media URLs
 * @param {string} [comment.parent_id] - Parent comment ID (for replies)
 * @returns {Promise} - Promise containing creation result
 */
export const createComment = async (routeId, comment) => {
  try {
    const response = await api.post(`/comments/routes/${routeId}`, comment);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create comment' };
  }
};

/**
 * Get comments for a route
 * @param {string} routeId - Route ID
 * @param {number} page - Page number
 * @param {number} limit - Number of comments per page
 * @returns {Promise} - Promise containing list of comments
 */
export const getComments = async (routeId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/comments/routes/${routeId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get comments' };
  }
};

/**
 * Get replies for a comment
 * @param {string} routeId - Route ID
 * @param {string} commentId - Comment ID
 * @param {number} page - Page number
 * @param {number} limit - Number of replies per page
 * @returns {Promise} - Promise containing list of replies
 */
export const getReplies = async (routeId, commentId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/comments/routes/${routeId}/comments/${commentId}/replies?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to get replies' };
  }
};

/**
 * Delete a comment
 * @param {string} routeId - Route ID
 * @param {string} commentId - Comment ID
 * @returns {Promise} - Promise containing deletion result
 */
export const deleteComment = async (routeId, commentId) => {
  try {
    const response = await api.delete(`/comments/routes/${routeId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete comment' };
  }
};

export default {
  uploadFile,
  createComment,
  getComments,
  getReplies,
  deleteComment,
}; 