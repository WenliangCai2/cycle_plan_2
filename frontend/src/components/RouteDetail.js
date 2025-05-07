/**
 * Route Detail Component
 * =======================
 * This module provides a detailed view of a single route with interactive map integration,
 * sharing functionality, voting system, and commenting capabilities.
 * 
 * Features:
 * - Interactive map showing the route with location markers
 * - Route statistics including shares, votes, and ratings
 * - Public/private visibility control for route owners
 * - Route sharing functionality with web API integration
 * - Voting system for public routes
 * - Threaded commenting system with ratings
 * - Route deletion capability for owners
 * - Responsive design with adaptive layouts
 * 
 * Author: [Your Name]
 * Contributors: Zhuoyi Zhang
 * Last Modified: 07/05/2025
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRouteById, shareRoute, updateRouteVisibility } from '../api/routeApi';
import { getRouteVotes } from '../api/voteApi';
import RouteComments from './RouteComments';
import RouteVote from './RouteVote';
import Map from '../Map';
// Import background image
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
  Backdrop,
  Switch
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
const apikey = 'RbwdXOHKZRDRFw0gKovUUV-eU_TiBYTSGrpRXbkv6MY';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

/**
 * Route Detail Component
 * 
 * Process:
 * 1. Fetches route details based on route ID from URL parameters
 * 2. Handles user geolocation for map centering
 * 3. Manages route visibility settings for owners
 * 4. Provides route sharing functionality with stats tracking
 * 5. Integrates voting and comments systems
 * 6. Handles route deletion with confirmation
 * 
 * Returns:
 *   Detailed route view with interactive map and social features
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
  
  /**
   * Gets user's current geolocation
   * 
   * Process:
   * 1. Checks browser geolocation support
   * 2. Requests user's location with high accuracy
   * 3. Updates user position state on success
   * 4. Falls back to default position if geolocation fails
   * 5. Manages loading state for location-dependent components
   * 
   * Side effects:
   *   Sets userPosition and locationLoading states
   */
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
  
  /**
   * Opens delete confirmation dialog
   * 
   * Process:
   * 1. Sets delete dialog state to open
   * 
   * Side effects:
   *   Updates deleteDialogOpen state
   */
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  /**
   * Closes delete confirmation dialog
   * 
   * Process:
   * 1. Sets delete dialog state to closed
   * 
   * Side effects:
   *   Updates deleteDialogOpen state
   */
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  /**
   * Handles route deletion
   * 
   * Process:
   * 1. Validates route ID and authentication
   * 2. Sends delete request to backend API
   * 3. Redirects to main page on success
   * 4. Provides error handling and user feedback
   * 5. Closes confirmation dialog
   * 
   * Side effects:
   *   Navigates to mainPage on successful deletion
   *   Closes delete dialog
   */
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
          // Navigate back to main page instead of root
          navigate('/mainPage');
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
  
  /**
   * Fetches route voting statistics
   * 
   * Process:
   * 1. Calls voting API with route ID
   * 2. Updates vote stats state with upvotes and downvotes
   * 3. Provides error handling
   * 
   * Side effects:
   *   Updates voteStats state
   */
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
  
  /**
   * Fetches route details from the API
   * 
   * Process:
   * 1. Sets loading state
   * 2. Fetches route data from API with route ID
   * 3. Updates component state with retrieved data
   * 4. Gets current user ID from localStorage
   * 5. Sets authentication state
   * 6. Handles error states with navigation
   * 
   * Side effects:
   *   Updates route, currentUserId, isAuthenticated states
   *   Updates loading state
   *   Navigates to mainPage on error
   */
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
        navigate('/mainPage');
      }
    } catch (error) {
      console.error('Failed to get route details:', error);
      navigate('/mainPage');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads route details and vote stats on component mount
   * 
   * Side effects:
   *   Calls fetchRouteDetail and fetchVoteStats
   */
  useEffect(() => {
    if (routeId) {
      fetchRouteDetail();
      // Get voting data separately when mounting components to ensure the latest
      fetchVoteStats();
    }
  }, [routeId]);

  /**
   * Handles URL fragment jump to comments section
   * 
   * Process:
   * 1. Checks if URL hash is #comments
   * 2. Scrolls to comments section with animation
   * 
   * Side effects:
   *   Scrolls page to comments section if hash is present
   */
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        const commentsSection = document.getElementById('comments');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Give time for page to load
    }
  }, [route]);
  
  /**
   * Handles vote changes
   * 
   * Process:
   * 1. Logs vote change
   * 2. Fetches latest vote statistics
   * 
   * Side effects:
   *   Calls fetchVoteStats to update voting data
   */
  const handleVoteChange = async () => {
    console.log('Voting has changed, get the latest voting data');
    await fetchVoteStats();
  };

  /**
   * Handles route visibility changes
   * 
   * Process:
   * 1. Updates local route state with new visibility
   * 
   * Args:
   *   isPublic (Boolean): New visibility state
   * 
   * Side effects:
   *   Updates route state with new is_public value
   */
  const handleVisibilityChange = (isPublic) => {
    // Update local route data
    setRoute(prev => ({
      ...prev,
      is_public: isPublic
    }));
  };

  /**
   * Navigates back to previous page
   * 
   * Process:
   * 1. Uses navigate(-1) to go back in history
   * 
   * Side effects:
   *   Triggers navigation to previous page
   */
  const goBack = () => {
    navigate(-1);
  };

  // Style definitions
  const backgroundStyle = {
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

  // Loading state display
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

  // Route not found state
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

/**
 * Render method for RouteDetail component
 * =======================
 * Renders the complete route details interface with interactive map,
 * route statistics, sharing functionality, and commenting system.
 * 
 * Process:
 * 1. Renders main container with glassmorphic styling
 * 2. Displays header with page title and navigation controls
 * 3. Renders route name and visibility settings
 * 4. Implements responsive layout with map and statistics panels
 * 5. Provides interactive elements for sharing and voting
 * 6. Integrates comments section with threaded functionality
 * 7. Implements confirmation dialog for route deletion
 * 
 * Returns:
 *   Complete route details page with all interactive elements and styling
 */
return (
  <Box sx={backgroundStyle}>
    <Container maxWidth="xl">
      {/* Main Content Container with Glassmorphic Effect */}
      <Paper elevation={0} sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)'
      }}>
        {/* Header with Navigation Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          {/* Back Button */}
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{ ...buttonStyle, color: 'black', borderColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            Back
          </Button>
          
          {/* Page Title */}
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'black'
          }}>
            <DirectionsBike sx={{ mr: 1 }} /> Route Details
          </Typography>
          
          {/* Delete Button - Only visible to route owner */}
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
        
        {/* Route Information Card */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(5px)',
          backgroundColor: 'transparent'
        }}>
          <CardContent>
            {/* Route Title and Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              {/* Route Name */}
              <Typography variant="h5" component="h2" fontWeight="bold" color="black">
                {route.name}
              </Typography>
              
              {/* Route Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Public/Private Indicator */}
                <Chip 
                  icon={route.is_public ? <PublicOutlined /> : <LockOutlined />} 
                  label={route.is_public ? 'Public' : 'Private'}
                  color={route.is_public ? 'primary' : 'default'}
                  variant="outlined"
                  sx={{ mr: 1 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Share Button with Web API Integration */}
                  <Button 
                    variant="contained" 
                    startIcon={<ShareIcon />} 
                    onClick={async () => {
                      try {
                        // Call share API and get share link
                        const response = await shareRoute(routeId);
                        
                        // Use modern Web API sharing feature (if browser supports)
                        if (navigator.share) {
                          await navigator.share({
                            title: route.name,
                            text: `Check out this cycling route: ${route.name}`,
                            url: response.share_url
                          });
                        } else {
                          // Copy link to clipboard
                          navigator.clipboard.writeText(response.share_url)
                            .then(() => {
                              alert('Link copied to clipboard!');
                            })
                            .catch(err => {
                              console.error('Unable to copy link:', err);
                            });
                        }
                        
                        // Local update share count
                        setRoute(prev => ({
                          ...prev,
                          share_count: (prev.share_count || 0) + 1
                        }));
                      } catch (error) {
                        console.error('Sharing route failed:', error);
                        alert('Sharing failed, please try again later.');
                      }
                    }}
                    sx={{ mr: 1, borderRadius: '20px' }}
                    size="small"
                  >
                    Share
                  </Button>
                  
                  {/* Visibility Toggle - Only visible to route owner */}
                  {isOwner && (
                    <Switch
                      checked={route.is_public}
                      onChange={async (event) => {
                        const isPublic = event.target.checked;
                        try {
                          await updateRouteVisibility(routeId, isPublic);
                          handleVisibilityChange(isPublic);
                        } catch (error) {
                          console.error('Updating visibility failed:', error);
                          alert('Updating visibility failed, please try again later.');
                        }
                      }}
                      icon={<LockOutlined />}
                      checkedIcon={<PublicOutlined />}
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Responsive Layout for Map and Statistics */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 3,
              mb: 3
            }}>
              {/* Map Section - Left Panel (70% on desktop) */}
              <Box sx={{ 
                height: '70vh',
                borderRadius: '8px', 
                overflow: 'hidden',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                flexGrow: 1,
                width: { xs: '100%', md: '70%' },
                backgroundColor: 'transparent'
              }}>
                {/* Map Component with Error Handling */}
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
                    backgroundColor: 'transparent'
                  }}>
                    <Typography color="text.secondary">
                      Cannot display route map - missing location data
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Statistics Section - Right Panel (30% on desktop) */}
              <Box sx={{ 
                width: { xs: '100%', md: '30%' },
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Route Statistics Panel */}
                <Box sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  mb: 2,
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'transparent'
                }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="black">
                    Route Statistics
                  </Typography>
                  
                  {/* Statistics Display with Icons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Shares Counter */}
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
                    
                    {/* Votes Counter */}
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
                    
                    {/* Rating Display - Only shown if route has ratings */}
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
                    
                    {/* Creation Date */}
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
                
                {/* Voting Section - Only shown for public routes */}
                {route.is_public && (
                  <Box sx={{ 
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'transparent',
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
        
        {/* Section Divider */}
        <Divider sx={{ my: 4, backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
        
        {/* Comments Section with ID for URL Fragment Navigation */}
        <Box id="comments">
          <RouteComments 
            routeId={routeId} 
            currentUserId={currentUserId} 
          />
        </Box>
      </Paper>
    </Container>
    
    {/* Delete Confirmation Dialog */}
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