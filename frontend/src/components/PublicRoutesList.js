import React, { useState, useEffect } from 'react';
import { List, Card, Rate, Button, Empty, Pagination, message, Spin, Radio } from 'antd';
import { RightOutlined, ShareAltOutlined, StarOutlined, ArrowLeftOutlined, LikeOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPublicRoutes } from '../api/routeApi';
import { useNavigate } from 'react-router-dom';
import RouteVote from './RouteVote';

/**
 * Public routes list component
 */
const PublicRoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [sortBy, setSortBy] = useState('vote_score');
  // Instead of using Redux, check for token directly
  const isAuthenticated = !!localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');
  
  const navigate = useNavigate();

  // Get public routes list
  const fetchPublicRoutes = async (page = 1, sort = sortBy) => {
    setLoading(true);
    
    try {
      const response = await getPublicRoutes(page, pagination.pageSize, sort, 'desc');
      
      if (response.success) {
        setRoutes(response.routes);
        setPagination({
          ...pagination,
          current: page,
          total: response.routes.length // Need to set based on API response total
        });
      } else {
        message.error('Failed to get routes');
      }
    } catch (error) {
      message.error('Failed to get public routes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load public routes after component mount
  useEffect(() => {
    fetchPublicRoutes();
  }, []);

  // Handle pagination change
  const handlePageChange = (page) => {
    fetchPublicRoutes(page);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    fetchPublicRoutes(pagination.current, newSortBy);
  };

  // View route details
  const viewRouteDetails = (routeId) => {
    navigate(`/routes/${routeId}`);
  };
  
  // Delete route (only for route owners)
  const handleDeleteRoute = async (routeId, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      message.error('Please login to delete routes');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
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
            // Remove route from state
            setRoutes(routes.filter(route => route.route_id !== routeId));
            message.success('Route deleted successfully');
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
    }
  };

  return (
    <div className="public-routes-list" style={{ padding: '20px' }}>
      <Button 
        onClick={() => navigate('/')}
        style={{ marginBottom: '20px' }}
        icon={<ArrowLeftOutlined />}
      >
        Back
      </Button>
      
      <h2 style={{ marginBottom: '20px' }}>Popular Routes</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <Radio.Group value={sortBy} onChange={handleSortChange}>
          <Radio.Button value="vote_score">
            <LikeOutlined /> Sort by Votes
          </Radio.Button>
          <Radio.Button value="share_count">
            <ShareAltOutlined /> Sort by Shares
          </Radio.Button>
          <Radio.Button value="avg_rating">
            <StarOutlined /> Sort by Rating
          </Radio.Button>
        </Radio.Group>
      </div>
      
      <Spin spinning={loading}>
        {routes.length > 0 ? (
          <>
            <List
              grid={{ gutter: 16, column: 1, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
              dataSource={routes}
              renderItem={route => (
                <List.Item>
                  <Card
                    hoverable
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{route.name}</span>
                        {route.user_id === currentUserId && (
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => handleDeleteRoute(route.route_id, e)}
                            title="Delete this route"
                          />
                        )}
                      </div>
                    }
                    extra={<Button type="text" icon={<RightOutlined />} onClick={() => viewRouteDetails(route.route_id)} />}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <Rate disabled allowHalf value={route.avg_rating || 0} style={{ fontSize: '14px' }} />
                      <span style={{ marginLeft: '10px' }}>({route.review_count || 0} reviews)</span>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <RouteVote 
                        routeId={route.route_id} 
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><ShareAltOutlined /> {route.share_count || 0} shares</span>
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => viewRouteDetails(route.route_id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                hideOnSinglePage
              />
            </div>
          </>
        ) : (
          <Empty description="No routes found" />
        )}
      </Spin>
    </div>
  );
};

export default PublicRoutesList; 