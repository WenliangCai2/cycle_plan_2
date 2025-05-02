import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRoutes } from '../api/routeApi';

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
  DialogActions
} from '@mui/material';

// Material UI icons
import {
  ThumbUpOutlined,
  ThumbUp,
  ShareOutlined,
  StarOutlined,
  ArrowBackOutlined,
  DeleteOutline,
  DirectionsBike,
  CommentOutlined,
  NavigateNextOutlined
} from '@mui/icons-material';

// Components
import RouteVote from './RouteVote';

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
        setRoutes(response.routes);
        setPagination({
          ...pagination,
          current: page,
          total: response.routes.length // Need to set based on API response total
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
  }, []);

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
    backgroundImage: 'url(/images/cycling-background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    paddingTop: '40px',
    paddingBottom: '40px'
  };

  const overlayStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  return (
    <Box sx={backgroundStyle}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={overlayStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              onClick={() => navigate('/')}
              sx={{ borderRadius: '20px' }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: '#2e7d32'
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
              sx={{ backgroundColor: '#f5f5f5', borderRadius: '28px' }}
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
              <Grid container spacing={3}>
                {routes.map(route => (
                  <Grid item xs={12} sm={6} md={4} key={route.route_id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: '12px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                      onClick={() => viewRouteDetails(route.route_id)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
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
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({route.review_count || 0})
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-around', 
                          my: 1.5 
                        }}>
                          <Chip
                            icon={<ShareOutlined fontSize="small" />}
                            label={route.share_count || 0}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<CommentOutlined fontSize="small" />}
                            label={route.review_count || 0}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'rgba(46, 125, 50, 0.05)' }}>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <RouteVote 
                            routeId={route.route_id} 
                            isAuthenticated={isAuthenticated}
                          />
                        </Box>
                        <Button 
                          variant="contained"
                          color="primary"
                          size="small" 
                          endIcon={<NavigateNextOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            viewRouteDetails(route.route_id);
                          }}
                          sx={{ borderRadius: '20px' }}
                        >
                          View Details
                        </Button>
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
                />
              </Box>
            </>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 2,
              bgcolor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '8px'
            }}>
              <DirectionsBike sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No routes found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
      >
        <DialogTitle id="delete-dialog-title">
          Delete route?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this route? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
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