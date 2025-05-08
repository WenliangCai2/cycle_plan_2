/**
 * Route Comments Component
 * =======================
 * This module provides a feature-rich commenting system for routes, allowing users 
 * to share their thoughts, upload media, and interact with other users' comments
 * through replies and ratings.
 * 
 * Features:
 * - Comment creation with text and media upload support
 * - Route rating system with star-based visualization
 * - Reply functionality for threaded conversations
 * - Comment and reply management (view, create, delete)
 * - Media attachment support (images and videos) with preview
 * - Pagination for both comments and replies
 * - User-friendly error handling and notifications
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { 
  List, Avatar, Form, Button, Input, Card, message, Pagination, 
  Tooltip, Popconfirm, Upload, Collapse, Divider, Modal, Rate
} from 'antd';
import { 
  UserOutlined, DeleteOutlined, PictureOutlined, 
  VideoCameraOutlined, SendOutlined, CommentOutlined,
  UploadOutlined, PlusOutlined, StarOutlined
} from '@ant-design/icons';
import { getComments, createComment, deleteComment, getReplies, uploadFile } from '../api/commentApi';
import { getUsernameById } from '../api/userApi';

const { TextArea } = Input;
const { Panel } = Collapse;

/**
 * Media Item Component
 * =======================
 * Displays a media item (image or video) with proper formatting and click handling.
 * 
 * Process:
 * 1. Determines media type (image or video)
 * 2. Renders appropriate element with consistent styling
 * 3. Attaches click handler for preview functionality
 * 
 * Args:
 *   url (String): URL of the media resource
 *   type (String): Media type ('image' or 'video')
 *   onClick (Function): Handler function for click events
 * 
 * Returns:
 *   Rendered media component with proper styling and interactivity
 */
const MediaItem = ({ url, type, onClick }) => {
  if (type === 'image') {
    return (
      <div className="media-item" onClick={onClick} style={{ cursor: 'pointer' }}>
        <img 
          src={url} 
          alt="Comment attachment" 
          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
        />
      </div>
    );
  } else if (type === 'video') {
    return (
      <div className="media-item" onClick={onClick} style={{ cursor: 'pointer' }}>
        <video 
          src={url} 
          controls
          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
        />
      </div>
    );
  }
  return null;
};

/**
 * Media Preview Modal Component
 * =======================
 * Provides a fullscreen modal for viewing media items in larger format.
 * 
 * Process:
 * 1. Renders a modal dialog when visible is true
 * 2. Dynamically renders image or video based on media type
 * 3. Provides close functionality
 * 
 * Args:
 *   visible (Boolean): Controls modal visibility
 *   media (Object): Media item with url and type properties
 *   onClose (Function): Handler for closing the modal
 * 
 * Returns:
 *   Modal dialog with media content and close button
 */
const MediaPreviewModal = ({ visible, media, onClose }) => {
  if (!media) return null;
  
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      width="80%"
      centered
      bodyStyle={{ padding: '24px', textAlign: 'center' }}
    >
      {media.type === 'image' ? (
        <img 
          src={media.url} 
          alt="Media preview" 
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      ) : (
        <video 
          src={media.url} 
          controls
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      )}
    </Modal>
  );
};

/**
 * Media Upload Component
 * =======================
 * Provides file upload functionality for attaching media to comments.
 * 
 * Process:
 * 1. Manages file state and upload process
 * 2. Handles file validation and submission to API
 * 3. Provides feedback during upload process
 * 4. Calls callback function on successful upload
 * 
 * Args:
 *   onUploadSuccess (Function): Callback for successful uploads
 * 
 * Returns:
 *   Upload button with file picker functionality
 */
const MediaUpload = ({ onUploadSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (response.success) {
        message.success('File uploaded successfully');
        onUploadSuccess({
          url: response.file_url,
          type: response.file_type
        });
        return false; // Prevent default upload behavior
      } else {
        message.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  const uploadProps = {
    name: 'file',
    beforeUpload: handleUpload,
    accept: '.jpg,.jpeg,.png,.gif,.mp4,.webm,.mov',
    showUploadList: false,
    disabled: uploading,
    fileList: fileList,
    onChange: ({ fileList }) => setFileList(fileList),
  };

  return (
    <Upload {...uploadProps}>
      <Button 
        icon={<UploadOutlined />} 
        loading={uploading}
        type="text"
        style={{ color: 'black' }}
      >
        Add Media
      </Button>
    </Upload>
  );
};

/**
 * Comment Editor Component
 * =======================
 * Provides input interface for creating comments and replies.
 * 
 * Process:
 * 1. Renders text area for content input
 * 2. Manages comment submission state
 * 3. Shows media preview for attached files
 * 4. Provides rating input for root comments
 * 
 * Args:
 *   onChange (Function): Handler for content changes
 *   onSubmit (Function): Handler for form submission
 *   submitting (Boolean): Indicates submission in progress
 *   content (String): Current text content
 *   username (String): Current user's username
 *   onMediaUpload (Function): Handler for media uploads
 *   mediaItems (Array): List of attached media items
 *   isReply (Boolean): Whether this editor is for a reply
 *   rating (Number): Current rating value
 *   setRating (Function): Handler for rating changes
 * 
 * Returns:
 *   Form with text area, media preview, and submission controls
 */
const CommentEditor = ({ 
  onChange, 
  onSubmit, 
  submitting, 
  content, 
  username,
  onMediaUpload,
  mediaItems,
  isReply,
  rating,
  setRating
}) => (
  <div>
    {!isReply && (
      <Form.Item>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate 
            allowHalf 
            value={rating} 
            onChange={setRating} 
          />
          <span style={{ marginLeft: '10px', color: 'black' }}>
            {rating ? `${rating} stars` : ''}
          </span>
        </div>
      </Form.Item>
    )}
    <Form.Item>
      <TextArea 
        rows={3} 
        onChange={onChange} 
        value={content} 
        placeholder={isReply ? "Write a reply..." : "Share your thoughts about this route..."}
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          color: 'black',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        }}
      />
    </Form.Item>
    
    {/* Media preview area */}
    {!isReply && mediaItems.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {mediaItems.map((item, index) => (
          <div key={index} style={{ position: 'relative', marginBottom: '8px' }}>
            <MediaItem url={item.url} type={item.type} />
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px',
                backgroundColor: 'rgba(0,0,0,0.5)'
              }}
              onClick={() => {
                const newMediaItems = [...mediaItems];
                newMediaItems.splice(index, 1);
                onMediaUpload(newMediaItems);
              }}
            />
          </div>
        ))}
      </div>
    )}
    
    <Form.Item style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {!isReply && (
          <MediaUpload
            onUploadSuccess={(media) => {
              onMediaUpload([...mediaItems, media]);
            }}
          />
        )}
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitting} 
          onClick={onSubmit}
          icon={<SendOutlined />}
        >
          {isReply ? 'Reply' : 'Post Comment'}
        </Button>
      </div>
    </Form.Item>
  </div>
);

/**
 * Route Comments Component
 * =======================
 * Main component for managing comments on a route.
 * 
 * Process:
 * 1. Fetches and displays comments for the specified route
 * 2. Manages comment creation, deletion, and replies
 * 3. Handles pagination for both comments and replies
 * 4. Provides media upload and preview functionality
 * 5. Manages user authentication and permission checking
 * 
 * Args:
 *   routeId (String): ID of the route to display comments for
 *   currentUserId (String): ID of the current logged-in user
 * 
 * Returns:
 *   Complete comments interface with creation form, comment list, and pagination
 */
const RouteComments = ({ routeId, currentUserId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [usernames, setUsernames] = useState({}); // Map of user IDs to usernames
  const currentUsername = localStorage.getItem('username') || 'You';
  const [mediaItems, setMediaItems] = useState([]);
  const [showReplies, setShowReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});
  const [replyPagination, setReplyPagination] = useState({});
  const [replies, setReplies] = useState({});
  const [mediaPreview, setMediaPreview] = useState(null);
  const [rating, setRating] = useState(5);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  /**
   * Fetch comments for the current route
   * 
   * Process:
   * 1. Sets loading state
   * 2. Calls API to fetch comments
   * 3. Updates component state with results
   * 4. Fetches usernames for comment authors
   * 5. Handles error states
   * 
   * Args:
   *   page (Number): Page number to fetch, defaults to 1
   */
  const fetchComments = async (page = 1) => {
    setLoading(true);
    
    try {
      const response = await getComments(routeId, page, pagination.pageSize);
      
      if (response.success) {
        setComments(response.comments);
        setAvgRating(response.avg_rating);
        setReviewCount(response.review_count);
        setPagination({
          ...pagination,
          current: page,
          total: response.total
        });
        
        // Collect unique user IDs from comments
        const userIds = [...new Set(response.comments.map(comment => comment.user_id))];
        
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
  
  /**
   * Fetch replies for a specific comment
   * 
   * Process:
   * 1. Sets loading state for the comment's replies
   * 2. Calls API to fetch replies
   * 3. Updates component state with results
   * 4. Fetches usernames for reply authors
   * 5. Handles error states
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   *   page (Number): Page number to fetch, defaults to 1
   */
  const fetchReplies = async (commentId, page = 1) => {
    try {
      // Set loading state for this comment's replies
      setReplies(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          loading: true
        }
      }));
      
      const pageSize = replyPagination[commentId]?.pageSize || 5;
      
      const response = await getReplies(routeId, commentId, page, pageSize);
      
      if (response.success) {
        // Update replies state
        setReplies(prev => ({
          ...prev,
          [commentId]: {
            items: response.replies,
            loading: false
          }
        }));
        
        // Update pagination for this comment
        setReplyPagination(prev => ({
          ...prev,
          [commentId]: {
            current: page,
            pageSize: pageSize,
            total: response.total
          }
        }));
        
        // Collect unique user IDs from replies
        const userIds = [...new Set(response.replies.map(reply => reply.user_id))];
        
        // Fetch usernames for reply authors
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
      message.error('Failed to load replies');
      console.error(error);
      
      // Clear loading state on error
      setReplies(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          loading: false
        }
      }));
    }
  };
  
  /**
   * Load comments when component mounts or routeId changes
   */
  useEffect(() => {
    if (routeId) {
      fetchComments();
    }
  }, [routeId]);
  
  /**
   * Handle reply section toggle
   * 
   * Process:
   * 1. Toggles visibility state for the comment's replies
   * 2. Fetches replies if needed when showing for the first time
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   */
  const handleShowReplies = (commentId) => {
    // Toggle reply section visibility
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    
    // If we're showing replies and haven't loaded them yet, fetch them
    if (!showReplies[commentId] && (!replies[commentId] || !replies[commentId].items)) {
      fetchReplies(commentId);
    }
  };
  
  /**
   * Handle content change for main comment input
   * 
   * Args:
   *   e (Event): Change event from text input
   */
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };
  
  /**
   * Handle content change for reply input
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   *   e (Event): Change event from text input
   */
  const handleReplyContentChange = (commentId, e) => {
    setReplyContent(prev => ({
      ...prev,
      [commentId]: e.target.value
    }));
  };
  
  /**
   * Submit a new comment
   * 
   * Process:
   * 1. Validates comment content
   * 2. Sets submitting state
   * 3. Calls API to create comment
   * 4. Updates component state on success
   * 5. Handles error states
   */
  const handleSubmit = async () => {
    if (!content.trim() && mediaItems.length === 0) {
      message.error('Please enter a comment or upload media');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await createComment(routeId, {
        content: content,
        rating: rating,
        media_urls: mediaItems.map(item => ({
          url: item.url,
          type: item.type
        }))
      });
      
      if (response.success) {
        setContent('');
        setMediaItems([]);
        setRating(5); // Reset rating
        // Reload comments list
        fetchComments();
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
   * Submit a reply to a comment
   * 
   * Process:
   * 1. Validates reply content
   * 2. Sets submitting state for the specific reply
   * 3. Calls API to create comment with parent_id
   * 4. Updates component state on success
   * 5. Handles error states
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   */
  const handleSubmitReply = async (commentId) => {
    if (!replyContent[commentId] || !replyContent[commentId].trim()) {
      message.error('Please enter a reply');
      return;
    }
    
    // Set submitting state for this comment's reply
    setReplySubmitting(prev => ({
      ...prev,
      [commentId]: true
    }));
    
    try {
      const response = await createComment(routeId, {
        content: replyContent[commentId],
        parent_id: commentId
      });
      
      if (response.success) {
        // Clear reply content
        setReplyContent(prev => ({
          ...prev,
          [commentId]: ''
        }));
        
        // Reload replies
        fetchReplies(commentId);
        
        // Update reply count in the parent comment
        setComments(prev => prev.map(comment => {
          if (comment.comment_id === commentId) {
            return {
              ...comment,
              reply_count: (comment.reply_count || 0) + 1
            };
          }
          return comment;
        }));
        
        message.success('Reply posted successfully');
      }
    } catch (error) {
      message.error('Failed to post reply');
      console.error(error);
    } finally {
      setReplySubmitting(prev => ({
        ...prev,
        [commentId]: false
      }));
    }
  };
  
  /**
   * Delete a comment
   * 
   * Process:
   * 1. Calls API to delete comment
   * 2. Reloads comments on success
   * 3. Handles error states
   * 
   * Args:
   *   commentId (String): ID of the comment to delete
   */
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await deleteComment(routeId, commentId);
      
      if (response.success) {
        // Reload comments list
        fetchComments();
        message.success('Comment deleted');
      }
    } catch (error) {
      message.error('Failed to delete comment');
      console.error(error);
    }
  };
  
  /**
   * Delete a reply
   * 
   * Process:
   * 1. Calls API to delete reply (comment with parent)
   * 2. Reloads replies for the parent comment
   * 3. Updates reply count for parent comment
   * 4. Handles error states
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   *   replyId (String): ID of the reply to delete
   */
  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const response = await deleteComment(routeId, replyId);
      
      if (response.success) {
        // Reload replies
        fetchReplies(commentId);
        
        // Update reply count in the parent comment
        setComments(prev => prev.map(comment => {
          if (comment.comment_id === commentId) {
            return {
              ...comment,
              reply_count: Math.max(0, (comment.reply_count || 0) - 1)
            };
          }
          return comment;
        }));
        
        message.success('Reply deleted');
      }
    } catch (error) {
      message.error('Failed to delete reply');
      console.error(error);
    }
  };
  
  /**
   * Handle pagination change for comments
   * 
   * Args:
   *   page (Number): New page number
   */
  const handlePageChange = (page) => {
    fetchComments(page);
  };
  
  /**
   * Handle pagination change for replies
   * 
   * Args:
   *   commentId (String): ID of the parent comment
   *   page (Number): New page number
   */
  const handleReplyPageChange = (commentId, page) => {
    fetchReplies(commentId, page);
  };
  
  /**
   * Format date string for display
   * 
   * Process:
   * 1. Converts string to Date object
   * 2. Formats using locale settings
   * 3. Handles errors gracefully
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
  
  /**
   * Open media preview modal
   * 
   * Args:
   *   media (Object): Media item to preview
   */
  const handleMediaPreview = (media) => {
    setMediaPreview(media);
  };
  
  /**
   * Close media preview modal
   */
  const handleCloseMediaPreview = () => {
    setMediaPreview(null);
  };
  
  // UI style definitions
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
  
  const commentStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(5px)',
    color: 'black'
  };

  const usernameStyle = {
    fontWeight: 'bold',
    marginBottom: '8px',
    color: 'black'
  };

  const contentStyle = {
    marginBottom: '8px',
    color: 'black'
  };

  const timestampStyle = {
    fontSize: '0.8rem',
    color: 'rgba(0, 0, 0, 0.7)'
  };
  
/**
 * Render method for RouteComments component
 * =======================
 * Renders the complete commenting UI including comment creation form, comments list,
 * replies, and paginations.
 * 
 * Process:
 * 1. Renders main card container with title and average rating
 * 2. Conditionally renders comment editor for authenticated users
 * 3. Renders list of comments with their metadata and content
 * 4. Handles media attachments display with preview functionality
 * 5. Implements threaded reply system with collapsible interface
 * 6. Provides pagination for both comments and replies
 * 7. Implements media preview modal for fullscreen viewing
 * 
 * Returns:
 *   Complete commenting interface with all interactive elements and styling
 */
return (
  <div className="route-comments">
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: 'black' }}>
          <span>Comments</span>
          {reviewCount > 0 && (
            <span style={{ marginLeft: '10px' }}>
              <Rate disabled allowHalf value={avgRating} style={{ fontSize: '16px' }} />
              <span style={{ marginLeft: '10px', color: 'black' }}>({reviewCount} reviews)</span>
            </span>
          )}
        </div>
      }
      loading={loading}
      style={transparentCardStyle}
      headStyle={cardHeaderStyle}
      bodyStyle={{ padding: '16px', color: 'black' }}
    >
      {/* Comment Editor Section */}
      {currentUserId && (
        <Card 
          className="comment-editor"
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
              <CommentEditor
                onChange={handleContentChange}
                onSubmit={handleSubmit}
                submitting={submitting}
                content={content}
                username={currentUsername}
                onMediaUpload={setMediaItems}
                mediaItems={mediaItems}
                isReply={false}
                rating={rating}
                setRating={setRating}
              />
            </div>
          </div>
        </Card>
      )}
      
      {/* Comments List Section */}
      {comments.length > 0 ? (
        <List
          className="comment-list"
          itemLayout="horizontal"
          dataSource={comments}
          style={{ color: 'black' }}
          renderItem={comment => (
            <List.Item style={{ 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 0',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '100%' }}>
                {/* Comment Header - Username, Date, Delete Button */}
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      color: 'black',
                      marginBottom: '5px'
                    }}>
                      <span>{comment.username || usernames[comment.user_id] || comment.user_id}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                        {formatDate(comment.created_at)}
                        {currentUserId === comment.user_id && (
                          <Popconfirm
                            title="Are you sure you want to delete this comment?"
                            onConfirm={() => handleDeleteComment(comment.comment_id)}
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
                      <Rate disabled allowHalf value={comment.rating} style={{ fontSize: '14px', marginBottom: '8px' }} />
                      <p style={{ color: 'black', marginBottom: '10px' }}>{comment.content}</p>
                    </div>
                  }
                />
                
                {/* Media Attachments Section */}
                {comment.media_urls && comment.media_urls.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', marginLeft: '48px' }}>
                    {comment.media_urls.map((media, index) => (
                      <MediaItem 
                        key={index} 
                        url={media.url} 
                        type={media.type} 
                        onClick={() => handleMediaPreview(media)}
                      />
                    ))}
                  </div>
                )}
                
                {/* Reply Button Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '48px' }}>
                  <Button 
                    type="text" 
                    icon={<CommentOutlined />} 
                    onClick={() => handleShowReplies(comment.comment_id)}
                    style={{ color: 'black' }}
                  >
                    {!showReplies[comment.comment_id] ? `Show Replies (${comment.reply_count || 0})` : 'Hide Replies'}
                  </Button>
                </div>
                
                {/* Replies Section - Conditionally Rendered */}
                {showReplies[comment.comment_id] && (
                  <div style={{ marginLeft: '48px', marginTop: '16px' }}>
                    {/* Reply Form */}
                    {currentUserId && (
                      <div style={{ marginBottom: '16px' }}>
                        <CommentEditor
                          onChange={(e) => handleReplyContentChange(comment.comment_id, e)}
                          onSubmit={() => handleSubmitReply(comment.comment_id)}
                          submitting={replySubmitting[comment.comment_id] || false}
                          content={replyContent[comment.comment_id] || ''}
                          username={currentUsername}
                          onMediaUpload={() => {}} // No media for replies
                          mediaItems={[]}
                          isReply={true}
                        />
                      </div>
                    )}
                    
                    {/* Replies List with Loading State */}
                    {replies[comment.comment_id]?.loading ? (
                      <div style={{ textAlign: 'center', padding: '10px' }}>Loading replies...</div>
                    ) : (
                      <>
                        {replies[comment.comment_id]?.items && replies[comment.comment_id].items.length > 0 ? (
                          <List
                            className="reply-list"
                            itemLayout="horizontal"
                            dataSource={replies[comment.comment_id]?.items || []}
                            renderItem={reply => (
                              <List.Item style={{ 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '12px 0',
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                              }}>
                                <div style={{ width: '100%' }}>
                                  <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={
                                      <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        color: 'black',
                                        marginBottom: '5px'
                                      }}>
                                        <span>{reply.username || usernames[reply.user_id] || reply.user_id}</span>
                                        <span style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '0.85rem' }}>
                                          {formatDate(reply.created_at)}
                                          {currentUserId === reply.user_id && (
                                            <Popconfirm
                                              title="Are you sure you want to delete this reply?"
                                              onConfirm={() => handleDeleteReply(comment.comment_id, reply.comment_id)}
                                              okText="Yes"
                                              cancelText="No"
                                            >
                                              <Tooltip title="Delete reply">
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
                                        <p style={{ color: 'black', marginBottom: '10px' }}>{reply.content}</p>
                                      </div>
                                    }
                                  />
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '10px',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            No replies yet. Be the first to reply!
                          </div>
                        )}
                        
                        {/* Reply Pagination */}
                        {replyPagination[comment.comment_id] && replyPagination[comment.comment_id].total > replyPagination[comment.comment_id].pageSize && (
                          <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <Pagination
                              size="small"
                              current={replyPagination[comment.comment_id].current}
                              pageSize={replyPagination[comment.comment_id].pageSize}
                              total={replyPagination[comment.comment_id].total}
                              onChange={(page) => handleReplyPageChange(comment.comment_id, page)}
                              hideOnSinglePage
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'white' }}>
          {loading ? 'Loading...' : 'No comments yet. Be the first to comment!'}
        </div>
      )}
      
      {/* Main Comments Pagination */}
      {comments.length > 0 && pagination.total > pagination.pageSize && (
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
      
      {/* Media Preview Modal */}
      <MediaPreviewModal
        visible={!!mediaPreview}
        media={mediaPreview}
        onClose={handleCloseMediaPreview}
      />
    </Card>
  </div>
);
};

export default RouteComments; 