import React, { useState, useEffect } from 'react';
import { List, Avatar, Form, Button, Input, Rate, Card, message, Pagination, Tooltip, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { createReview, getReviews, deleteReview } from '../api/reviewApi';

const { TextArea } = Input;

/**
 * Review editor component
 */
const ReviewEditor = ({ onChange, onSubmit, submitting, content, rating, setRating }) => (
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

  return (
    <div className="route-reviews">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>Comments</span>
            {reviewCount > 0 && (
              <span style={{ marginLeft: '10px' }}>
                <Rate disabled allowHalf value={avgRating} style={{ fontSize: '16px' }} />
                <span style={{ marginLeft: '10px' }}>({reviewCount} reviews)</span>
              </span>
            )}
          </div>
        }
        loading={loading}
      >
        {currentUserId && (
          <Card 
            className="review-editor"
            bordered={false}
            style={{ marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: '10px', marginTop: '5px' }} />
              <div style={{ flex: 1 }}>
                <ReviewEditor
                  onChange={handleContentChange}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  content={content}
                  rating={rating}
                  setRating={setRating}
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
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.user_id}</span>
                      <span>
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
                    <div>
                      <Rate disabled allowHalf value={item.rating} style={{ fontSize: '14px' }} />
                      <p>{item.content}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default RouteReviews; 