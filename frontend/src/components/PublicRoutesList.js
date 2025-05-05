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

// Background image array - using uploaded images (as default fallback images)
const BACKGROUND_IMAGES = [
  '/images/backgrounds/WechatIMG831.jpeg',
  '/images/backgrounds/WechatIMG832.jpeg',
  '/images/backgrounds/WechatIMG833.jpeg',
  '/images/backgrounds/WechatIMG834.jpeg',
  '/images/backgrounds/WechatIMG835.jpeg',
];

/**
 * Public routes list component with Material UI styling
 */
const PublicRoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [sortBy, setSortBy] = useState('vote_score');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  
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
        // Add default background image for routes without images
        const routesWithImages = response.routes.map((route, index) => ({
          ...route,
          // If the route has no image, use default image, otherwise use the user-uploaded image
          backgroundImage: route.image_url || BACKGROUND_IMAGES[index % BACKGROUND_IMAGES.length]
        }));
        
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
      setLoading(false);
    }
  };

  // Load public routes after component mount
  useEffect(() => {
    fetchPublicRoutes();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pagination change
  const handlePageChange = (event, page) => {
    fetchPublicRoutes(page);
  };

  // Handle sort change
  const handleSortChange = (event, newSortBy) => {
    if (newSortBy !== null) {
      setSortBy(newSortBy);
      fetchPublicRoutes(pagination.current, newSortBy);
    }
  };

  // View route details
  const viewRouteDetails = (routeId) => {
    navigate(`/routes/${routeId}`);
  };
  
  // Open delete dialog
  const openDeleteDialog = (routeId, e) => {
    e.stopPropagation();
    setRouteToDelete(routeId);
    setDeleteDialogOpen(true);
  };
  
  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };
  
  // Delete route (only for route owners)
  const handleDeleteRoute = async () => {
    if (!isAuthenticated || !routeToDelete) {
      closeDeleteDialog();
      return;
    }
    
    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Use direct fetch API
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
          // Remove route from state
          setRoutes(routes.filter(route => route.route_id !== routeToDelete));
          console.log('Route deleted successfully');
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
          
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
          
          {routes.length > 0 ? (
            <>
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
                      {/* Add background image */}
                      <CardMedia
                        component="img"
                        height="160"
                        image={route.backgroundImage}
                        alt={route.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      
                      <CardContent sx={{ flexGrow: 1 }}>
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
                      
                      <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'rgba(46, 125, 50, 0)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box onClick={(e) => e.stopPropagation()}>
                            <RouteVote 
                              routeId={route.route_id} 
                              isAuthenticated={isAuthenticated}
                            />
                          </Box>
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
                                    // If Web sharing API is not available, redirect to share page
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
                                  
                                  // Local update share count
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