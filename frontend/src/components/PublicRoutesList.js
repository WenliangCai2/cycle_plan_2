import React, { useState, useEffect } from 'react';
import { List, Card, Rate, Button, Empty, Pagination, message, Spin } from 'antd';
import { RightOutlined, ShareAltOutlined, StarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getPublicRoutes } from '../api/routeApi';
import { useNavigate } from 'react-router-dom';

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
  
  const navigate = useNavigate();

  // Get public routes list
  const fetchPublicRoutes = async (page = 1) => {
    setLoading(true);
    
    try {
      const response = await getPublicRoutes(page, pagination.pageSize);
      
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

  // View route details
  const viewRouteDetails = (routeId) => {
    navigate(`/routes/${routeId}`);
  };

  return (
    <div className="public-routes-list" style={{ padding: '20px' }}>
      <Button 
        onClick={() => navigate('/')}
        style={{ marginBottom: '20px' }}
        icon={<ArrowLeftOutlined />}
      >
        back
      </Button>
      
      <h2 style={{ marginBottom: '20px' }}>Popular Routes</h2>
      
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
                    title={route.name}
                    extra={<Button type="text" icon={<RightOutlined />} onClick={() => viewRouteDetails(route.route_id)} />}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <Rate disabled allowHalf value={route.avg_rating || 0} style={{ fontSize: '14px' }} />
                      <span style={{ marginLeft: '10px' }}>({route.review_count || 0} reviews)</span>
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
          <Empty description="empty" />
        )}
      </Spin>
    </div>
  );
};

export default PublicRoutesList; 