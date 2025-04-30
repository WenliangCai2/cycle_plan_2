import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, message, Spin, Row, Col, Divider, Tag, Rate, Popconfirm } from 'antd';
import { ArrowLeftOutlined, ShareAltOutlined, EnvironmentOutlined, GlobalOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRouteById } from '../api/routeApi';
import { getRouteVotes } from '../api/voteApi';
import ShareRoute from './ShareRoute';
import RouteReviews from './RouteReviews';
import RouteVote from './RouteVote';
import Map from '../Map';

// Use the same apikey as in App.js
const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

/**
 * Route detail component
 */
const RouteDetail = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userPosition, setUserPosition] = useState(defaultPosition);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Add voting status
  const [voteStats, setVoteStats] = useState({
    upvotes: 0,
    downvotes: 0,
  });
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success handler
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
          console.log("User location obtained successfully");
        },
        (error) => {
          // Error handler
          console.error("Error getting location:", error);
          message.info("Using default location. Enable location services for better experience.");
          setLocationLoading(false);
        },
        // Options
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Browser doesn't support geolocation
      console.error("Geolocation is not supported by this browser");
      message.info("Geolocation not supported by your browser. Using default location.");
      setLocationLoading(false);
    }
  }, []);
  
  // Handle route deletion
  const handleDeleteRoute = async () => {
    if (!routeId || !isAuthenticated) {
      message.error('Cannot delete route. Please check if you are logged in.');
      return;
    }

    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Use direct fetch API
      const response = await fetch(
        `http://localhost:5000/api/routes/${routeId}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          message.success('Route deleted successfully');
          // Navigate back to home page
          navigate('/');
        } else {
          message.error(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      } else {
        if (response.status === 403) {
          message.error('You can only delete your own routes');
        } else {
          message.error(`Server error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      message.error('Failed to delete route');
    }
  };
  
  // Get voting statistics
  const fetchVoteStats = async () => {
    try {
      const response = await getRouteVotes(routeId);
      if (response.success) {
        console.log('Get the latest voting data:', response);
        setVoteStats({
          upvotes: response.upvotes || 0,
          downvotes: response.downvotes || 0
        });
      }
    } catch (error) {
      console.error('Failed to obtain voting data:', error);
    }
  };
  
  // Get route details
  const fetchRouteDetail = async () => {
    setLoading(true);
    
    try {
      const response = await getRouteById(routeId);
      
      if (response.success) {
        console.log('Route detail data:', response.route);
        setRoute(response.route);
        
        // Get current user ID from localStorage
        const token = localStorage.getItem('token');
        if (token) {
          const userId = localStorage.getItem('userId');
          setCurrentUserId(userId);
          setIsAuthenticated(true);
        }
      } else {
        message.error('Failed to get route details');
        navigate('/');
      }
    } catch (error) {
      message.error('Failed to get route details');
      console.error(error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Load route details and vote stats after component mount
  useEffect(() => {
    if (routeId) {
      fetchRouteDetail();
      // Get voting data separately when mounting components to ensure the latest
      fetchVoteStats();
    }
  }, [routeId]);

  // Handling vote changes
  const handleVoteChange = async () => {
    console.log('Voting has changed, get the latest voting data');
    await fetchVoteStats();
  };

  // Handle route visibility change
  const handleVisibilityChange = (isPublic) => {
    // Update local route data
    setRoute(prev => ({
      ...prev,
      is_public: isPublic
    }));
  };

  // Go back to previous page
  const goBack = () => {
    navigate(-1);
  };

  if (loading || locationLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p>{locationLoading ? 'Getting your location...' : 'Loading route details...'}</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="route-not-found">
        <h2>Route not found</h2>
        <Button type="primary" onClick={goBack}>Go back</Button>
      </div>
    );
  }

  const isOwner = currentUserId && currentUserId === route.user_id;

  return (
    <div className="route-detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={goBack}
        >
          Back
        </Button>
        
        {isOwner && (
          <Popconfirm
            title="Delete Route"
            description="Are you sure you want to delete this route? This action cannot be undone."
            onConfirm={handleDeleteRoute}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
            >
              Delete Route
            </Button>
          </Popconfirm>
        )}
      </div>
      
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{route.name}</span>
            <Tag color={route.is_public ? 'blue' : 'default'}>
              {route.is_public ? <><GlobalOutlined /> Public</> : <><LockOutlined /> Private</>}
            </Tag>
          </div>
        }
        extra={isOwner && <ShareRoute routeId={routeId} isPublic={route.is_public} onVisibilityChange={handleVisibilityChange} />}
      >
        {/* Added voting widget - only visible for public routes */}
        {route.is_public && (
          <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Vote for this route</h3>
            <RouteVote routeId={routeId} isAuthenticated={isAuthenticated} onVoteChange={handleVoteChange} />
          </div>
        )}
        
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ height: '400px', marginBottom: '20px' }}>
              {route.locations && Array.isArray(route.locations) && route.locations.length > 0 ? (
                <Map 
                  apikey={apikey} 
                  locations={route.locations} 
                  userPosition={userPosition}
                  selectedLocations={route.locations || []}
                  restaurantList={[]}
                  customPoints={[]}
                  loading={locationLoading}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Cannot display route map - missing location data</p>
                </div>
              )}
            </div>
          </Col>
          
          <Col span={24}>
            <div className="route-stats">
              <div>
                <strong>Share count:</strong> {route.share_count || 0}
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <strong>Votes:</strong> {voteStats.upvotes} upvotes, {voteStats.downvotes} downvotes
              </div>
              
              {route.avg_rating > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Average rating:</strong> 
                  <Rate disabled allowHalf value={route.avg_rating} style={{ fontSize: '16px', marginLeft: '10px' }} />
                  <span style={{ marginLeft: '10px' }}>({route.review_count || 0} reviews)</span>
                </div>
              )}
              
              <div style={{ marginTop: '10px' }}>
                <strong>Created at:</strong> {new Date(route.created_at).toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
        
        <Divider />
        
        <RouteReviews routeId={routeId} currentUserId={currentUserId} />
      </Card>
    </div>
  );
};

export default RouteDetail;