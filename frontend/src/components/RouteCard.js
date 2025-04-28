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

const { Meta } = Card;
const { Text, Paragraph } = Typography;

/**
 * Route card component for displaying route information
 * @param {Object} props
 * @param {Object} props.route - Route data
 */
const RouteCard = ({ route }) => {
  const dispatch = useDispatch();
  const favorites = useSelector(state => state.favorites.items);
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  
  // Check if the route is in favorites
  const isFavorite = favorites.some(fav => fav.id === route.id);

  // Handle favorite toggle
  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      dispatch(toggleFavorite(route));
    }
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Format duration
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
          <div className="route-card-cover">
            <img 
              alt={route.name} 
              src={route.image_url || placeholderImage} 
              style={{ height: 200, objectFit: 'cover' }}
            />
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
          <Space>
            <EyeOutlined />
            <span>{route.views || 0}</span>
          </Space>,
          <Space>
            <CommentOutlined />
            <span>{route.reviews_count || 0}</span>
          </Space>,
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
              <Paragraph ellipsis={{ rows: 2 }}>
                {route.description || "No description available"}
              </Paragraph>
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap>
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
                  
                  {route.route_type && (
                    <Tag color="blue">
                      {route.route_type === 'loop' ? 'Loop' :
                       route.route_type === 'out_and_back' ? 'Out & Back' :
                       route.route_type === 'point_to_point' ? 'Point to Point' : route.route_type}
                    </Tag>
                  )}
                  
                  {route.tags && route.tags.slice(0, 2).map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
                
                <Space wrap size={16}>
                  {route.distance && (
                    <Text type="secondary">
                      <EnvironmentOutlined /> {formatDistance(route.distance)}
                    </Text>
                  )}
                  
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