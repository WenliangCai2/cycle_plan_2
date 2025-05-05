import React, { useState, useEffect } from 'react';
import { List, Avatar, Form, Button, Input, Rate, Card, message, Pagination, Tooltip, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { createReview, getReviews, deleteReview } from '../api/reviewApi';
import { getUsernameById } from '../api/userApi';

const { TextArea } = Input;

/**
 * Review editor component - Adapted to fit transparent background style
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
 * Route reviews component
 * @param {Object} props
 * @param {string} props.routeId - Route ID
 * @param {string} props.currentUserId - Current logged in user ID
 */
const RouteReviews = ({ routeId, currentUserId }) => {
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [usernames, setUsernames] = useState({}); // Map of user IDs to usernames
  const currentUsername = localStorage.getItem('username') || 'You';

  // Get reviews list
  const fetchReviews = async (page = 1) => {
    setLoading(true);
    
    try {
      const response = await getReviews(routeId, page, pagination.pageSize);
      
      if (response.success) {
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
                setUsernames(prev => ({
                  ...prev,
                  [userId]: currentUsername
                }));
              } else {

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

  // Load reviews after component mount
  useEffect(() => {
    if (routeId) {
      fetchReviews();
    }
  }, [routeId]);

  // Handle content change
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Submit review
  const handleSubmit = async () => {
    if (!content.trim()) {
      message.error('Please enter a comment');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await createReview(routeId, {
        content: content,
        rating: rating
      });
      
      if (response.success) {
        setContent('');
        // Reload reviews list
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

  // Delete review
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

  // Handle pagination change
  const handlePageChange = (page) => {
    fetchReviews(page);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Transparent card style
  const transparentCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden'
  };

  // Transparent Card header style
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