/**
 * Route Reviews Component
 * =======================
 * This module provides a review system for routes with star ratings, comments,
 * and user interaction features.
 * 
 * Features:
 * - Star rating system with half-star precision
 * - Review comments with user attribution
 * - Review deletion for authenticated users
 * - Pagination for efficient navigation of reviews
 * - Average rating display with review count
 * - Transparent UI design with glass-like styling
 * - Responsive layout for different device sizes
 * - Date formatting for review timestamps
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { List, Avatar, Form, Button, Input, Rate, Card, message, Pagination, Tooltip, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { createReview, getReviews, deleteReview } from '../api/reviewApi';
import { getUsernameById } from '../api/userApi';

const { TextArea } = Input;

/**
 * Review editor component for creating new reviews
 * 
 * Process:
 * 1. Displays star rating input for route evaluation
 * 2. Provides text area for review content
 * 3. Includes submission button with loading state
 * 4. Adapts styling to match transparent background
 * 
 * Args:
 *   onChange (Function): Handler for content text changes
 *   onSubmit (Function): Handler for form submission
 *   submitting (Boolean): Loading state for submission
 *   content (String): Current review text value
 *   rating (Number): Current star rating value
 *   setRating (Function): Handler for rating changes
 *   username (String): Username of the reviewer
 * 
 * Returns:
 *   Review editor form with rating and text input
 */
const ReviewEditor = ({ onChange, onSubmit, submitting, content, rating, setRating, username }) => (
  <div>
    <Form.Item>
      <Rate 
        allowHalf 
        value={rating} 
        onChange={setRating} 
      />
    </Form.Item>
    <Form.Item>
      <TextArea 
        rows={4} 
        onChange={onChange} 
        value={content} 
        placeholder="Share your thoughts about this route..."
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          color: 'black',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        }}
      />
    </Form.Item>
    <Form.Item>
      <Button 
        htmlType="submit" 
        loading={submitting} 
        onClick={onSubmit} 
        type="primary"
      >
        Post Comment
      </Button>
    </Form.Item>
  </div>
);

/**
 * Route reviews component for displaying and managing reviews
 * 
 * Process:
 * 1. Fetches reviews from backend API
 * 2. Handles review creation and deletion
 * 3. Manages pagination for multiple reviews
 * 4. Displays average rating and review count
 * 5. Shows user information with avatar and username
 * 
 * Args:
 *   routeId (String/Number): ID of the route being reviewed
 *   currentUserId (String/Number): ID of the current logged-in user
 * 
 * Returns:
 *   Complete review system with creation form and list
 */
const RouteReviews = ({ routeId, currentUserId }) => {
  // State for reviews data and UI management
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Rating statistics state
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  
  // User information state
  const [usernames, setUsernames] = useState({}); // Map of user IDs to usernames
  const currentUsername = localStorage.getItem('username') || 'You';

  /**
   * Fetch reviews for the current route
   * 
   * Process:
   * 1. Sets loading state for UI feedback
   * 2. Requests reviews from backend API with pagination
   * 3. Updates reviews state and rating statistics
   * 4. Fetches usernames for review authors
   * 5. Handles errors with appropriate messages
   * 
   * Args:
   *   page (Number): Page number to fetch, defaults to 1
   */
  const fetchReviews = async (page = 1) => {
    setLoading(true);
    
    try {
      const response = await getReviews(routeId, page, pagination.pageSize);
      
      if (response.success) {
        // Update reviews and rating data
        setReviews(response.reviews);
        setAvgRating(response.avg_rating);
        setReviewCount(response.review_count);
        setPagination({
          ...pagination,
          current: page,
          total: response.reviews.length // Need to set based on API response total
        });
        
        // Collect unique user IDs from reviews
        const userIds = [...new Set(response.reviews.map(review => review.user_id))];
        
        // Fetch usernames for all user IDs if they're not already loaded
        userIds.forEach(async (userId) => {
          if (!usernames[userId]) {
            try {
              if (userId === currentUserId) {
                // Use local username for current user
                setUsernames(prev => ({
                  ...prev,
                  [userId]: currentUsername
                }));
              } else {
                // Fetch username from API for other users
                const response = await getUsernameById(userId);
                setUsernames(prev => ({
                  ...prev,
                  [userId]: response.username || userId
                }));
              }
            } catch (error) {
              console.error(`Failed to get username for ${userId}:`, error);
              // Fallback to showing user ID
              setUsernames(prev => ({
                ...prev,
                [userId]: userId
              }));
            }
          }
        });
      }
    } catch (error) {
      message.error('Failed to get comments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load reviews after component mount
   * 
   * Process:
   * 1. Triggers fetchReviews when routeId is available
   * 2. Only runs once on initial render
   */
  useEffect(() => {
    if (routeId) {
      fetchReviews();
    }
  }, [routeId]);

  /**
   * Handle content change for review input
   * 
   * Process:
   * 1. Updates content state with new input value
   * 
   * Args:
   *   e (Event): Change event from input field
   */
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  /**
   * Submit a new review
   * 
   * Process:
   * 1. Validates required content
   * 2. Sets submitting state for UI feedback
   * 3. Sends review data to backend API
   * 4. Resets form and reloads reviews on success
   * 5. Handles errors with appropriate messages
   */
  const handleSubmit = async () => {
    // Validate input
    if (!content.trim()) {
      message.error('Please enter a comment');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create review with API
      const response = await createReview(routeId, {
        content: content,
        rating: rating
      });
      
      if (response.success) {
        // Reset form and reload reviews
        setContent('');
        fetchReviews();
        message.success('Comment posted successfully');
      }
    } catch (error) {
      message.error('Failed to post comment');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Delete a review
   * 
   * Process:
   * 1. Sends delete request to backend API
   * 2. Reloads reviews list on success
   * 3. Handles errors with appropriate messages
   * 
   * Args:
   *   reviewId (String/Number): ID of the review to delete
   */
  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await deleteReview(routeId, reviewId);
      
      if (response.success) {
        // Reload reviews list
        fetchReviews();
        message.success('Comment deleted');
      }
    } catch (error) {
      message.error('Failed to delete comment');
      console.error(error);
    }
  };

  /**
   * Handle pagination change
   * 
   * Process:
   * 1. Fetches reviews for the selected page
   * 
   * Args:
   *   page (Number): Page number to load
   */
  const handlePageChange = (page) => {
    fetchReviews(page);
  };

  /**
   * Format date string for display
   * 
   * Process:
   * 1. Creates Date object from string
   * 2. Formats to locale string representation
   * 3. Handles errors with fallback to original string
   * 
   * Args:
   *   dateString (String): Date string to format
   * 
   * Returns:
   *   Formatted date string
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Style definitions for UI components
  const transparentCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden'
  };

  const cardHeaderStyle = {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    color: 'white',
    fontWeight: 'bold',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  return (
    <div className="route-reviews">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <span>Comments</span>
            {/* Display average rating if reviews exist */}
            {reviewCount > 0 && (
              <span style={{ marginLeft: '10px' }}>
                <Rate disabled allowHalf value={avgRating} style={{ fontSize: '16px' }} />
                <span style={{ marginLeft: '10px', color: 'white' }}>({reviewCount} reviews)</span>
              </span>
            )}
          </div>
        }
        loading={loading}
        style={transparentCardStyle}
        headStyle={cardHeaderStyle}
        bodyStyle={{ padding: '16px', color: 'black' }}
      >
        {/* Review editor for authenticated users */}
        {currentUserId && (
          <Card 
            className="review-editor"
            bordered={false}
            style={{ 
              marginBottom: '20px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px' 
            }}
            bodyStyle={{ 
              padding: '16px', 
              color: 'black' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: '10px', marginTop: '5px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>{currentUsername}</div>
                <ReviewEditor
                  onChange={handleContentChange}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  content={content}
                  rating={rating}
                  setRating={setRating}
                  username={currentUsername}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Reviews list or empty state */}
        {reviews.length > 0 ? (
          <List
            className="comment-list"
            itemLayout="horizontal"
            dataSource={reviews}
            style={{ color: 'black' }}
            renderItem={item => (
              <List.Item style={{ 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 0' 
              }}>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      color: 'black'
                    }}>
                      <span>{item.username || usernames[item.user_id] || item.user_id}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                        {formatDate(item.created_at)}
                        {/* Delete button for review owner */}
                        {currentUserId === item.user_id && (
                          <Popconfirm
                            title="Are you sure you want to delete this comment?"
                            onConfirm={() => handleDeleteReview(item.review_id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Tooltip title="Delete comment">
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{ marginLeft: '10px' }}
                              />
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ color: 'black' }}>
                      <Rate disabled allowHalf value={item.rating} style={{ fontSize: '14px' }} />
                      <p style={{ color: 'black', marginTop: '8px' }}>{item.content}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'black' }}>
            {loading ? 'Loading...' : 'No comments yet'}
          </div>
        )}

        {/* Pagination controls */}
        {reviews.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              hideOnSinglePage
              style={{ 
                '& .ant-pagination-item': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                '& .ant-pagination-item-active': { backgroundColor: 'rgba(25, 118, 210, 0.5)' }
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default RouteReviews;