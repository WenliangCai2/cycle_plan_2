/**
 * Public Routes List Component
 * =======================
 * This module displays a list of publicly shared routes with sorting, filtering, 
 * and interactive features for user engagement.
 * 
 * Features:
 * - Route cards with image thumbnails and metadata
 * - Sorting options by votes, shares, and ratings
 * - Pagination for efficient navigation
 * - Background image with glass-like UI elements
 * - Route deletion for route owners
 * - Sharing functionality with web share API support
 * - Rating display with star visualization
 * - Loading states with visual feedback
 * - Empty state handling with user guidance
 * - Responsive grid layout for different devices
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRoutes, shareRoute } from '../api/routeApi';
// Import background image
import backgroundImage from '../images/AdobeStock_1092964965_Preview.jpeg';

// Material UI imports
import { 
  Box, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Grid, 
  Container,
  Rating,
  Pagination,
  CircularProgress, 
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Chip,
  Paper,
  Divider,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardMedia
} from '@mui/material';

// Material UI icons
import {
  ThumbUp,
  ShareOutlined,
  StarOutlined,
  ArrowBackOutlined,
  DeleteOutline,
  DirectionsBike,
  CommentOutlined
} from '@mui/icons-material';

// Components
import RouteVote from './RouteVote';

// Default background images as fallbacks for routes without custom images
const BACKGROUND_IMAGES = [
  '/images/backgrounds/WechatIMG831.jpeg',
  '/images/backgrounds/WechatIMG832.jpeg',
  '/images/backgrounds/WechatIMG833.jpeg',
  '/images/backgrounds/WechatIMG834.jpeg',
  '/images/backgrounds/WechatIMG835.jpeg',
];

/**
 * Public routes list component that displays all publicly shared cycling routes
 * 
 * Process:
 * 1. Fetches public routes with pagination and sorting
 * 2. Displays routes in responsive card grid layout
 * 3. Enables interactive features like voting and sharing
 * 4. Provides sorting controls for different metrics
 * 5. Handles route deletion for authorized users
 * 6. Manages loading and empty states appropriately
 * 
 * Returns:
 *   Public routes page with interactive route cards and controls
 */
const PublicRoutesList = () => {
  // State for routes data and UI management
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,  // Number of routes per page
    total: 0       // Total number of routes (from API)
  });
  
  // Sorting state and deletion handling
  const [sortBy, setSortBy] = useState('vote_score');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  
  // Authentication state - Using localStorage instead of Redux
  const isAuthenticated = !!localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');
  
  // Navigation hook
  const navigate = useNavigate();

  /**
   * Fetch public routes with sorting and pagination
   * 
   * Process:
   * 1. Shows loading indicator during fetch
   * 2. Requests routes from backend API with parameters
   * 3. Processes routes to add default images if needed
   * 4. Updates component state with retrieved data
   * 5. Handles error conditions with proper logging
   * 
   * Args:
   *   page (Number): Page number to fetch
   *   sort (String): Sort parameter for ordering results
   */
  const fetchPublicRoutes = async (page = 1, sort = sortBy) => {
    setLoading(true);
    
    try {
      // Call API with pagination and sorting parameters
      const response = await getPublicRoutes(page, pagination.pageSize, sort, 'desc');
      
      if (response.success) {
        // Process routes to ensure all have background images
        const routesWithImages = response.routes.map((route, index) => ({
          ...route,
          // If route has no image, use default fallback from array
          backgroundImage: route.image_url || BACKGROUND_IMAGES[index % BACKGROUND_IMAGES.length]
        }));
        
        // Update routes state and pagination data
        setRoutes(routesWithImages);
        setPagination({
          ...pagination,
          current: page,
          total: response.total || 0
        });
      } else {
        console.error('Failed to get routes');
      }
    } catch (error) {
      console.error('Failed to get public routes:', error);
    } finally {
      // Always disable loading state when finished
      setLoading(false);
    }
  };

  /**
   * Load public routes after component mount
   * 
   * Process:
   * 1. Calls fetchPublicRoutes with default parameters
   * 2. Only runs once on component initialization
   */
  useEffect(() => {
    fetchPublicRoutes();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle pagination control changes
   * 
   * Process:
   * 1. Receives new page number from pagination component
   * 2. Fetches routes for selected page
   * 
   * Args:
   *   event (Event): Change event from pagination control
   *   page (Number): New page number to load
   */
  const handlePageChange = (event, page) => {
    fetchPublicRoutes(page);
  };

  /**
   * Handle sorting parameter changes
   * 
   * Process:
   * 1. Validates new sort parameter is not null
   * 2. Updates state with selected sorting criteria
   * 3. Refetches routes with new sorting parameter
   * 
   * Args:
   *   event (Event): Change event from toggle button group
   *   newSortBy (String): New sorting parameter
   */
  const handleSortChange = (event, newSortBy) => {
    if (newSortBy !== null) {
      setSortBy(newSortBy);
      fetchPublicRoutes(pagination.current, newSortBy);
    }
  };

  /**
   * Navigate to route details page
   * 
   * Process:
   * 1. Uses React Router to navigate to route details
   * 2. Constructs URL with route ID parameter
   * 
   * Args:
   *   routeId (String/Number): ID of route to view
   */
  const viewRouteDetails = (routeId) => {
    navigate(`/routes/${routeId}`);
  };
  
  /**
   * Open delete confirmation dialog
   * 
   * Process:
   * 1. Stops event propagation to prevent card click
   * 2. Sets route ID to delete state
   * 3. Opens confirmation dialog
   * 
   * Args:
   *   routeId (String/Number): ID of route to delete
   *   e (Event): Click event to prevent propagation
   */
  const openDeleteDialog = (routeId, e) => {
    e.stopPropagation();
    setRouteToDelete(routeId);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Close delete confirmation dialog
   * 
   * Process:
   * 1. Closes dialog by updating state
   * 2. Clears route to delete state
   */
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };
  
  /**
   * Delete route after confirmation
   * 
   * Process:
   * 1. Verifies authentication and route ID
   * 2. Sends deletion request to backend API
   * 3. Updates routes list upon successful deletion
   * 4. Handles different error conditions
   * 5. Closes dialog regardless of outcome
   */
  const handleDeleteRoute = async () => {
    // Verify requirements are met
    if (!isAuthenticated || !routeToDelete) {
      closeDeleteDialog();
      return;
    }
    
    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Send deletion request to API
      const response = await fetch(
        `http://localhost:5000/api/routes/${routeToDelete}`, 
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
          // Remove deleted route from state
          setRoutes(routes.filter(route => route.route_id !== routeToDelete));
          console.log('Route deleted successfully');
        } else {
          console.error(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      } else {
        // Handle specific error cases
        if (response.status === 403) {
          console.error('You can only delete your own routes');
        } else {
          console.error(`Server error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error deleting route:', error);
    } finally {
      // Always close dialog when finished
      closeDeleteDialog();
    }
  };

  // Style definitions for background and overlay
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    paddingTop: '40px',
    paddingBottom: '40px'
  };

  const overlayStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    backdropFilter: 'blur(0px)',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: 'none'
  };

  return (
    <Box sx={backgroundStyle}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={overlayStyle}>
          {/* Header with title and back button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              onClick={() => navigate('/mainPage')}
              sx={{ borderRadius: '20px', color: 'black', borderColor: 'rgba(0, 0, 0, 0.5)' }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'black'
            }}>
              <DirectionsBike sx={{ mr: 1 }} /> Public Cycling Routes
            </Typography>
            <Box /> {/* Empty box for flex spacing */}
          </Box>
          
          {/* Sorting controls */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={handleSortChange}
              aria-label="sort routes by"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '28px',
                '& .MuiToggleButton-root': {
                  color: 'black',
                  borderColor: 'rgba(0, 0, 0, 0.2)'
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  backgroundColor: 'rgba(46, 125, 50, 0.5)',
                  color: 'black'
                }
              }}
            >
              <ToggleButton value="vote_score" aria-label="sort by votes" sx={{ borderRadius: '28px 0 0 28px' }}>
                <ThumbUp sx={{ mr: 1 }} />
                Votes
              </ToggleButton>
              <ToggleButton value="share_count" aria-label="sort by shares">
                <ShareOutlined sx={{ mr: 1 }} />
                Shares
              </ToggleButton>
              <ToggleButton value="avg_rating" aria-label="sort by rating" sx={{ borderRadius: '0 28px 28px 0' }}>
                <StarOutlined sx={{ mr: 1 }} />
                Rating
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Loading indicator */}
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
          
          {/* Routes grid or empty state */}
          {routes.length > 0 ? (
            <>
              {/* Routes grid */}
              <Grid container spacing={3} justifyContent="center">
                {routes.map(route => (
                  <Grid item xs={12} sm={6} md={4} key={route.route_id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: '12px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        overflow: 'hidden', // Ensure images don't exceed card boundaries
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(3px)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                      onClick={() => viewRouteDetails(route.route_id)}
                    >
                      {/* Route image */}
                      <CardMedia
                        component="img"
                        height="160"
                        image={route.backgroundImage}
                        alt={route.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      
                      {/* Route content */}
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Title and delete button (if owner) */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'black' }}>
                            {route.name}
                          </Typography>
                          {route.user_id === currentUserId && (
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => openDeleteDialog(route.route_id, e)}
                              title="Delete this route"
                            >
                              <DeleteOutline />
                            </IconButton>
                          )}
                        </Box>
                        
                        {/* Rating display */}
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={route.avg_rating || 0} 
                            precision={0.5} 
                            readOnly 
                            size="small" 
                          />
                          <Typography variant="body2" color="black" sx={{ ml: 1, opacity: 0.8 }}>
                            ({route.review_count || 0})
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
                      </CardContent>
                      
                      {/* Action buttons */}
                      <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'rgba(46, 125, 50, 0)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Vote button */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            <RouteVote 
                              routeId={route.route_id} 
                              isAuthenticated={isAuthenticated}
                            />
                          </Box>
                          
                          {/* Share button */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            <Chip
                              icon={<ShareOutlined fontSize="small" />}
                              label={route.share_count || 0}
                              size="small"
                              variant="outlined"
                              sx={{ cursor: 'pointer', color: 'black', borderColor: 'rgba(0, 0, 0, 0.3)' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  // Call share API and get share link
                                  const response = await shareRoute(route.route_id);
                                  
                                  // Use modern Web API sharing feature (if browser supports)
                                  if (navigator.share) {
                                    await navigator.share({
                                      title: route.name,
                                      text: `Check out this cycling route: ${route.name}`,
                                      url: response.share_url
                                    });
                                  } else {
                                    // Fallback for browsers without Web Share API
                                    navigate(`/routes/${route.route_id}`);
                                    
                                    // Copy link to clipboard
                                    navigator.clipboard.writeText(response.share_url)
                                      .then(() => {
                                        alert('Link copied to clipboard!');
                                      })
                                      .catch(err => {
                                        console.error('Unable to copy link:', err);
                                      });
                                  }
                                  
                                  // Update share count locally
                                  setRoutes(prevRoutes => 
                                    prevRoutes.map(r => 
                                      r.route_id === route.route_id 
                                        ? { ...r, share_count: (r.share_count || 0) + 1 } 
                                        : r
                                    )
                                  );
                                } catch (error) {
                                  console.error('Failed to share route:', error);
                                  alert('Failed to share, please try again later.');
                                }
                              }}
                            />
                          </Box>
                          
                          {/* Comments button */}
                          <Chip
                            icon={<CommentOutlined fontSize="small" />}
                            label={route.review_count || 0}
                            size="small"
                            variant="outlined"
                            sx={{ cursor: 'pointer', color: 'black', borderColor: 'rgba(0, 0, 0, 0.3)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/routes/${route.route_id}#comments`);
                            }}
                          />
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(pagination.total / pagination.pageSize)}
                  page={pagination.current}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton 
                  showLastButton
                  siblingCount={1}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'black'
                    },
                    '& .MuiPaginationItem-page.Mui-selected': {
                      backgroundColor: 'rgba(46, 125, 50, 0.5)'
                    }
                  }}
                />
              </Box>
            </>
          ) : (
            // Empty state display when no routes found
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 2,
              bgcolor: 'rgba(0, 0, 0, 0)',
              borderRadius: '8px'
            }}>
              <DirectionsBike sx={{ fontSize: 60, color: 'black', mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" color="black">
                No routes found
              </Typography>
              <Typography variant="body2" color="black" sx={{ mt: 1, opacity: 0.7 }}>
                Create a new route or check back later
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        PaperProps={{
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(3px)',
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

export default PublicRoutesList;