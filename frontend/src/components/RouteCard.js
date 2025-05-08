/**
 * Route Card Component
 * =======================
 * This module provides a reusable card component for displaying route information
 * with interactive elements and metadata.
 * 
 * Features:
 * - Visual display of route image and details
 * - Favorite toggling functionality
 * - Rating display with star indicators
 * - Route metadata with formatted distance and duration
 * - Tag-based categorization for difficulty and route type
 * - View count and review count indicators
 * - Linked navigation to detailed route view
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React from 'react';
import { Card, Tag, Space, Tooltip, Typography, Rate } from 'antd';
import {
  HeartOutlined, HeartFilled, StarOutlined, StarFilled,
  CommentOutlined, EyeOutlined, EnvironmentOutlined, ClockOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite } from '../store/slices/favoritesSlice';
import placeholderImage from '../assets/images/route-placeholder.jpg';

// Extract Ant Design components for better readability
const { Meta } = Card;
const { Text, Paragraph } = Typography;

/**
 * Route card component for displaying route information
 * 
 * Process:
 * 1. Retrieves authentication and favorites state from Redux
 * 2. Renders route image with favorite toggle functionality
 * 3. Displays route metadata with proper formatting
 * 4. Shows difficulty and route type indicators
 * 5. Provides interaction metrics for views, comments, and ratings
 * 
 * Args:
 *   route (Object): Route data object with details and metadata
 * 
 * Returns:
 *   Route card component with interactive elements
 */
const RouteCard = ({ route }) => {
  // Redux hooks for state management
  const dispatch = useDispatch();
  const favorites = useSelector(state => state.favorites.items);
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  
  // Check if this route is in user's favorites
  const isFavorite = favorites.some(fav => fav.id === route.id);

  /**
   * Handle favorite toggle action
   * 
   * Process:
   * 1. Prevents default link behavior
   * 2. Stops event propagation to parent elements
   * 3. Verifies user is authenticated before action
   * 4. Dispatches Redux action to toggle favorite status
   * 
   * Args:
   *   e (Event): Click event object
   */
  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      dispatch(toggleFavorite(route));
    }
  };

  /**
   * Format distance for user-friendly display
   * 
   * Process:
   * 1. Checks if distance is less than 1km
   * 2. Returns meters for short distances
   * 3. Converts to kilometers with decimal for longer distances
   * 
   * Args:
   *   meters (Number): Distance in meters
   * 
   * Returns:
   *   Formatted distance string with appropriate unit
   */
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  /**
   * Format duration for user-friendly display
   * 
   * Process:
   * 1. Checks if duration is defined
   * 2. Converts seconds to hours and minutes
   * 3. Returns formatted string based on duration length
   * 
   * Args:
   *   seconds (Number): Duration in seconds
   * 
   * Returns:
   *   Formatted duration string or 'Unknown' if not defined
   */
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <Link to={`/routes/${route.id}`}>
      <Card
        hoverable
        cover={
          // Route image with favorite action overlay
          <div className="route-card-cover">
            <img 
              alt={route.name} 
              src={route.image_url || placeholderImage} 
              style={{ height: 200, objectFit: 'cover' }}
            />
            {/* Favorite action button overlay */}
            <div className="route-card-actions">
              <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <span onClick={handleFavoriteToggle}>
                  {isFavorite ? 
                    <HeartFilled style={{ color: '#ff4d4f' }} /> : 
                    <HeartOutlined />
                  }
                </span>
              </Tooltip>
            </div>
          </div>
        }
        actions={[
          // Views count
          <Space>
            <EyeOutlined />
            <span>{route.views || 0}</span>
          </Space>,
          // Comments count
          <Space>
            <CommentOutlined />
            <span>{route.reviews_count || 0}</span>
          </Space>,
          // Rating display
          <Space>
            {route.avg_rating > 0 ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
            <span>{route.avg_rating ? route.avg_rating.toFixed(1) : 'N/A'}</span>
          </Space>
        ]}
      >
        <Meta
          title={route.name}
          description={
            <>
              {/* Route description */}
              <Paragraph ellipsis={{ rows: 2 }}>
                {route.description || "No description available"}
              </Paragraph>
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {/* Tags section for route characteristics */}
                <Space wrap>
                  {/* Difficulty tag with color coding */}
                  {route.difficulty && (
                    <Tag color={
                      route.difficulty === 'easy' ? 'green' :
                      route.difficulty === 'moderate' ? 'orange' :
                      route.difficulty === 'hard' ? 'red' : 'default'
                    }>
                      {route.difficulty === 'easy' ? 'Easy' :
                       route.difficulty === 'moderate' ? 'Moderate' :
                       route.difficulty === 'hard' ? 'Hard' : route.difficulty}
                    </Tag>
                  )}
                  
                  {/* Route type tag */}
                  {route.route_type && (
                    <Tag color="blue">
                      {route.route_type === 'loop' ? 'Loop' :
                       route.route_type === 'out_and_back' ? 'Out & Back' :
                       route.route_type === 'point_to_point' ? 'Point to Point' : route.route_type}
                    </Tag>
                  )}
                  
                  {/* Additional tags (limit to 2 for space) */}
                  {route.tags && route.tags.slice(0, 2).map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
                
                {/* Route metrics section */}
                <Space wrap size={16}>
                  {/* Distance with icon */}
                  {route.distance && (
                    <Text type="secondary">
                      <EnvironmentOutlined /> {formatDistance(route.distance)}
                    </Text>
                  )}
                  
                  {/* Duration with icon */}
                  {route.estimated_time && (
                    <Text type="secondary">
                      <ClockOutlined /> {formatDuration(route.estimated_time)}
                    </Text>
                  )}
                </Space>
              </Space>
            </>
          }
        />
      </Card>
    </Link>
  );
};

export default RouteCard;