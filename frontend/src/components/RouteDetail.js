import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRouteById } from '../api/routeApi';
import { getRouteVotes } from '../api/voteApi';
import ShareRoute from './ShareRoute';
import RouteReviews from './RouteReviews';
import RouteVote from './RouteVote';
import Map from '../Map';
// 导入背景图片
import backgroundImage from '../images/AdobeStock_1092964965_Preview.jpeg';

// Material UI imports
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Rating,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Backdrop
} from '@mui/material';

// Material UI icons
import {
  ArrowBack as ArrowBackIcon,
  PublicOutlined,
  LockOutlined,
  ThumbUp,
  Share as ShareIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  DirectionsBike
} from '@mui/icons-material';

// Use the same apikey as in App.js
const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

/**
 * Route detail component with Material UI styling
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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
          console.info("Using default location. Enable location services for better experience.");
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
      console.info("Geolocation not supported by your browser. Using default location.");
      setLocationLoading(false);
    }
  }, []);
  
  // Open delete dialog
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle route deletion
  const handleDeleteRoute = async () => {
    if (!routeId || !isAuthenticated) {
      console.error('Cannot delete route. Please check if you are logged in.');
      closeDeleteDialog();
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
          console.log('Route deleted successfully');
          // Navigate back to home page
          navigate('/');
        } else {
          console.error(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      } else {
        if (response.status === 403) {
          console.error('You can only delete your own routes');
        } else {
          console.error(`Server error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error deleting route:', error);
    } finally {
      closeDeleteDialog();
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
        console.error('Failed to get route details');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to get route details:', error);
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

  const backgroundStyle = {
    backgroundImage: route && route.image_url ? 
      `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${route.image_url})` : 
      `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    paddingTop: '40px',
    paddingBottom: '40px'
  };

  const overlayStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(5px)'
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(5px)'
  };

  const sectionStyle = {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderRadius: '8px',
    padding: '16px',
    backdropFilter: 'blur(5px)'
  };

  const buttonStyle = {
    backdropFilter: 'blur(5px)',
    borderRadius: '20px'
  };

  if (loading || locationLoading) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" sx={{ mb: 2 }} />
          <Typography variant="h6" color="black">
            {locationLoading ? 'Getting your location...' : 'Loading route details...'}
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  if (!route) {
    return (
      <Box sx={backgroundStyle}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={overlayStyle}>
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <DirectionsBike sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Route not found
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={goBack}
                sx={{ mt: 2, borderRadius: '20px' }}
              >
                Go back
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  const isOwner = currentUserId && currentUserId === route.user_id;

  return (
    <Box sx={backgroundStyle}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={overlayStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={goBack}
              sx={{ ...buttonStyle, color: 'black', borderColor: 'rgba(0, 0, 0, 0.5)' }}
            >
              Back
            </Button>
            
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'black'
            }}>
              <DirectionsBike sx={{ mr: 1 }} /> Route Details
            </Typography>
            
            {isOwner && (
              <Button 
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={openDeleteDialog}
                sx={{ ...buttonStyle }}
              >
                Delete Route
              </Button>
            )}
          </Box>
          
          <Card sx={{ 
            mb: 4, 
            ...cardStyle
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" color="black">
                  {route.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    icon={route.is_public ? <PublicOutlined /> : <LockOutlined />} 
                    label={route.is_public ? 'Public' : 'Private'}
                    color={route.is_public ? 'primary' : 'default'}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  
                  {isOwner && (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <ShareRoute 
                        routeId={routeId} 
                        isPublic={route.is_public} 
                        onVisibilityChange={handleVisibilityChange} 
                      />
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* 修改布局: 将地图和统计数据放在水平Flex容器中 */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: 3,
                mb: 3
              }}>
                {/* Map Section - 左侧占据更多空间 */}
                <Box sx={{ 
                  height: '400px', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  flexGrow: 1,
                  width: { xs: '100%', md: '70%' }
                }}>
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
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.03)'
                    }}>
                      <Typography color="text.secondary">
                        Cannot display route map - missing location data
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Stats Section - 右侧 */}
                <Box sx={{ 
                  width: { xs: '100%', md: '30%' },
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Route Statistics */}
                  <Box sx={{ 
                    ...sectionStyle, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    mb: 2
                  }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="black">
                      Route Statistics
                    </Typography>
                    
                    {/* 竖向排列的统计信息 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <ShareIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="black" sx={{ opacity: 0.7 }}>
                            Shares
                          </Typography>
                          <Typography variant="h6" color="black">
                            {route.share_count || 0}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <ThumbUp />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="black" sx={{ opacity: 0.7 }}>
                            Votes
                          </Typography>
                          <Typography variant="h6" color="black">
                            {voteStats.upvotes} upvotes, {voteStats.downvotes} downvotes
                          </Typography>
                        </Box>
                      </Box>
                      
                      {route.avg_rating > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center'
                        }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <CommentIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="black" sx={{ opacity: 0.7 }}>
                              Rating
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating 
                                value={route.avg_rating} 
                                precision={0.5} 
                                readOnly 
                                size="small" 
                              />
                              <Typography variant="body2" color="black" sx={{ opacity: 0.7, ml: 1 }}>
                                ({route.review_count || 0} reviews)
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <DirectionsBike />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="black" sx={{ opacity: 0.7 }}>
                            Created
                          </Typography>
                          <Typography variant="body1" color="black">
                            {new Date(route.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Vote Section */}
                  {route.is_public && (
                    <Box sx={{ 
                      ...sectionStyle,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      p: 2
                    }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold" color="black">
                        Vote for this route
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <RouteVote 
                            routeId={routeId} 
                            isAuthenticated={isAuthenticated} 
                            onVoteChange={handleVoteChange} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Divider sx={{ my: 4, backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
          
          <RouteReviews routeId={routeId} currentUserId={currentUserId} />
        </Paper>
      </Container>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        PaperProps={{
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: 'black' }}>
          Delete route?
        </DialogTitle>
        <DialogContent>
          <Typography color="black">
            Are you sure you want to delete this route? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} sx={{ color: 'black' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteRoute} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteDetail;