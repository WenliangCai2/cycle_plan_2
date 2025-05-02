// App.js Complete Version - Using Material-UI Components
import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  Link,
  useLocation 
} from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip, 
  CircularProgress, 
  IconButton, 
  Grid, 
  Tooltip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Snackbar, 
  Alert, 
  useTheme,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Avatar,
  Pagination
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Clear as ClearIcon,
  Save as SaveIcon, 
  Logout as LogoutIcon, 
  Public as PublicIcon,
  Explore as ExploreIcon,
  Preview as PreviewIcon,
  Place as PlaceIcon,
  AccessTime as AccessTimeIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  AccountCircle,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import Map from './Map';
import RestaurantList from "./RestaurantList";
import LoginForm from './LoginForm';
import { createCustomPoint, getCustomPoints } from './api/customPointApi';
import { createRoute, getRoutes, deleteRoute } from './api/routeApi';
import { logout } from './api/authApi';
import ProtectedRoute from './components/ProtectedRoute';
import RouteDetail from './components/RouteDetail';
import PublicRoutesList from './components/PublicRoutesList';

const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

// Empty restaurant list - no predefined locations
const restaurantList = [];

// Paginated Points List Component
const PaginatedPointsList = ({ points, selectedLocations, onPointClick, itemsPerPage = 5, onDeletePoint }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(points.length / itemsPerPage);
  
  // Get current page points
  const currentPagePoints = points.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );
  
  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  return (
    <Box>
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <List disablePadding>
          {currentPagePoints.map((point, index) => (
            <React.Fragment key={point.point_id || `${page}-${index}`}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                button
                selected={selectedLocations.some(
                  l => l.lat === point.location.lat && l.lng === point.location.lng
                )}
                onClick={() => onPointClick(point.location)}
                sx={{
                  borderRadius: 0,
                  '&.Mui-selected': {
                    backgroundColor: `rgba(25, 118, 210, 0.1)`,
                    '&:hover': {
                      backgroundColor: `rgba(25, 118, 210, 0.2)`,
                    }
                  }
                }}
                secondaryAction={
                  point.isCustom ? (
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeletePoint) onDeletePoint(point);
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : null
                }
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  mr: point.isCustom ? 5 : 2 // Reserve space for delete button
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold', mr: 1 }}>
                      {point.name || `${index + 1 + page * itemsPerPage}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {point.isCurrentLocation ? 'Current location' : (point.isCustom ? 'Custom point' : 'POI')}
                  </Typography>
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
          
          {/* If current page doesn't have enough items, add empty item */}
          {currentPagePoints.length === 0 && (
            <ListItem>
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, width: '100%', textAlign: 'center' }}>
                No points available
              </Typography>
            </ListItem>
          )}
        </List>
      </Paper>
      
      {/* Pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => setPage(0)}
            disabled={page === 0}
            size="small"
          >
            <Box component="span" sx={{ fontSize: '1.2rem' }}>«</Box>
          </IconButton>
          
          <IconButton 
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            disabled={page === 0}
            size="small"
          >
            <Box component="span" sx={{ fontSize: '1.2rem' }}>‹</Box>
          </IconButton>
          
          <Typography variant="body2" sx={{ mx: 1 }}>
            {`${page + 1} / ${Math.max(1, totalPages)}`}
          </Typography>
          
          <IconButton 
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            size="small"
          >
            <Box component="span" sx={{ fontSize: '1.2rem' }}>›</Box>
          </IconButton>
          
          <IconButton 
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            size="small"
          >
            <Box component="span" sx={{ fontSize: '1.2rem' }}>»</Box>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// AppHeader Component - Add top navigation bar without affecting original functionality
const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const username = localStorage.getItem('username') || 'User';
  
  // Monitor route changes, update tab status
  useEffect(() => {
    if (location.pathname === '/') {
      setTabValue(0);
    } else if (location.pathname === '/public-routes') {
      setTabValue(1);
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate('/');
    } else if (newValue === 1) {
      navigate('/public-routes');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <ExploreIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Route Explorer
          </Typography>
          
          <Tabs 
            value={tabValue} 
            onChange={handleChange} 
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ marginLeft: 2 }}
          >
            <Tab icon={<HomeIcon />} label="Home" />
            <Tab icon={<PublicIcon />} label="Popular Routes" />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {username}
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
            {username.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Layout component wrapping application content
const AppLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};

// Extract main app content into a separate component
const MainApp = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [customPoints, setCustomPoints] = useState([]);
  const [newPointName, setNewPointName] = useState('');
  const [newPointLocation, setNewPointLocation] = useState({ lat: null, lng: null });
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [routeName, setRouteName] = useState('');
  const userId = localStorage.getItem('userId');
  const [userPosition, setUserPosition] = useState(defaultPosition);
  const [locationLoading, setLocationLoading] = useState(true);
  const username = localStorage.getItem('username') || 'User';
  
  // New notification message state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    routeId: null
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
          showSnackbar("Using default location. Enable location services for better experience.", "info");
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
      showSnackbar("Geolocation not supported by your browser. Using default location.", "info");
      setLocationLoading(false);
    }
  }, []);

  // Helper function to display notification messages
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close notification message
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Delete custom point
  const handleDeleteCustomPoint = async (point) => {
    if (!point || !point.point_id) {
      showSnackbar("Cannot delete point: missing point ID", "error");
      return;
    }
    
    try {
      // Here should add code to call backend API to delete points
      // For example: await deleteCustomPoint(point.point_id);
      
      // Since your code doesn't show deleteCustomPoint API,
      // we'll just update frontend state to simulate deletion effect
      
      // Remove from custom points list
      setCustomPoints(prev => prev.filter(p => p.point_id !== point.point_id));
      
      // If point is in currently selected route, also remove from there
      setSelectedRestaurants(prev => 
        prev.filter(loc => !(loc.point_id === point.point_id))
      );
      
      showSnackbar("Custom point deleted successfully");
    } catch (error) {
      console.error("Error deleting custom point:", error);
      showSnackbar("Failed to delete custom point", "error");
    }
  };

  // Load user's custom points and routes
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load custom points
        const pointsResponse = await getCustomPoints();
        if (pointsResponse.success) {
          // Ensure each custom point has correct isCustom tag and point_id
          const customPoints = (pointsResponse.customPoints || []).map(point => {
            console.log("Processing custom point from backend:", point);
            // Make sure each point has the required properties
            return {
              ...point,
              isCustom: true, // Ensure isCustom tag
              point_id: point.point_id, // Ensure point_id
              location: point.location || {} // Ensure location exists
            };
          });
          console.log('Loaded custom points:', customPoints);
          setCustomPoints(customPoints);
        } else {
          console.error("Failed to load custom points:", pointsResponse.message);
          showSnackbar("Failed to load custom points", "error");
        }
        
        // Load routes
        const routesResponse = await getRoutes();
        if (routesResponse.success) {
          setSavedRoutes(routesResponse.routes || []);
        } else {
          showSnackbar("Failed to load routes", "error");
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        showSnackbar("Failed to load user data", "error");
      }
    };
    
    loadUserData();
  }, []);

  // Handle login success
  const handleLoginSuccess = (newUserId, newUsername) => {
    console.log("User logged in successfully:", newUserId, newUsername);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('username', newUsername);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('userId');
      localStorage.removeItem('username'); // Also remove username
      localStorage.removeItem('token'); // Remove token
      // Clear user data
      setSelectedRestaurants([]);
      setCustomPoints([]);
      setSavedRoutes([]);
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state and navigate to login page
      localStorage.removeItem('userId');
      localStorage.removeItem('username'); // Also remove username
      localStorage.removeItem('token'); // Remove token
      setSelectedRestaurants([]);
      setCustomPoints([]);
      setSavedRoutes([]);
      navigate('/login');
    }
  };

  // Save current route
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    if (routeName && selectedRestaurants.length > 0) {
      try {
        // Ensure each location in the route has all necessary properties
        const processedLocations = selectedRestaurants.map(location => {
          // Make sure custom points have proper attributes
          if (location.isCustom) {
            return {
              ...location,
              point_id: location.point_id, // Ensure point_id is included
              isCustom: true
            };
          }
          return location;
        });
        
        const newRoute = {
          name: routeName,
          locations: processedLocations,
          is_public: false, // Default to private
          user_id: userId // Use user_id to match backend model
        };
        
        const response = await createRoute(newRoute);
        
        if (response.success) {
          console.log('Route saved successfully:', response);
          // Use complete route object returned from backend, including route_id
          const savedRoute = response.route;
          setSavedRoutes(prev => [...prev, savedRoute]);
          showSnackbar('Route saved successfully');
        } else {
          console.error('Failed to save route:', response.message);
          showSnackbar('Failed to save route', 'error');
        }
        
        setRouteName('');
      } catch (error) {
        console.error('Error saving route:', error);
        showSnackbar('Error saving route', 'error');
      }
    } else {
      showSnackbar('Please provide a route name and select at least one point', 'warning');
    }
  };

  // Load saved route
  const loadSavedRoute = (route) => {
    setSelectedRestaurants(route.locations);
    showSnackbar(`Loaded route: ${route.name}`);
  };

  // Handle restaurant click event
  const handleRestaurantClick = (location) => {
    setSelectedRestaurants(prev => {
      const exists = prev.some(l => l.lat === location.lat && l.lng === location.lng);
      return exists
        ? prev.filter(l => !(l.lat === location.lat && l.lng === location.lng))
        : [...prev, location];
    });
  };

  // Handle custom point form submission
  const handleAddCustomPoint = async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Log submission
    if (newPointName && newPointLocation.lat && newPointLocation.lng) {
      try {
        const newPoint = {
          name: newPointName,
          location: newPointLocation,
          isCustom: true, // Mark as custom point
          userId: userId // Add userId association
        };
        
        // Send request to backend to create custom point
        const response = await createCustomPoint(newPoint);
        
        if (response.success) {
          console.log('Custom point saved successfully:', response);
          // Ensure returned point has the correct properties
          const savedPoint = {
            ...(response.point || newPoint),
            isCustom: true, // Ensure isCustom tag
            point_id: response.point?.point_id || newPoint.point_id, // Ensure point_id exists
          };
          console.log('Saving point with data:', savedPoint);
          setCustomPoints(prev => [...prev, savedPoint]);
          showSnackbar('Custom point added successfully');
          
          // Show instructions to the user about using the custom point
          showSnackbar('Click on the custom point to add it to your current route', 'info');
        } else {
          console.error('Failed to save custom point:', response.message);
          showSnackbar('Failed to add custom point: ' + response.message, 'error');
        }
        
        setNewPointName('');
        setNewPointLocation({ lat: null, lng: null });
      } catch (error) {
        console.error('Error saving custom point:', error);
        showSnackbar('Error adding custom point', 'error');
      }
    } else {
      console.error('Missing name or location'); // Log error
      showSnackbar('Please provide both a name and select a location on the map', 'warning');
    }
  };

  // Handle map click event (to get custom point location)
  const handleMapClick = (lat, lng) => {
    console.log('Map click received:', lat, lng); // Log map click
    setNewPointLocation({ lat, lng });
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (routeId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setDeleteDialog({
      open: true,
      routeId
    });
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      routeId: null
    });
  };

  // Handle route deletion using fetch API instead of axios
  const handleDeleteRoute = async () => {
    const routeId = deleteDialog.routeId;
    
    if (!routeId) {
      console.error("Cannot delete route: no route ID provided");
      showSnackbar("Cannot delete route: missing ID", "error");
      closeDeleteDialog();
      return;
    }
    
    try {
      console.log("Attempting to delete route with ID:", routeId);
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      
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
      
      console.log("Delete route response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Delete route response data:", data);
        
        if (data.success) {
          // Remove route from state
          setSavedRoutes(prev => prev.filter(route => route.route_id !== routeId));
          showSnackbar('Route deleted successfully');
        } else {
          showSnackbar(`Delete failed: ${data.message || 'Unknown error'}`, 'error');
        }
      } else {
        showSnackbar(`Server error: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      showSnackbar(`Failed to delete route: ${error.message || 'Unknown error'}`, 'error');
    }
    
    closeDeleteDialog();
  };

  // Create a current location point object
  const currentLocationPoint = {
    name: "Your Current Location",
    location: userPosition,
    isCurrentLocation: true // Special flag to identify current location
  };

  // Merge custom points and current location point
  const allPoints = [...customPoints, currentLocationPoint];

  // Listen for changes in customPoints state
  useEffect(() => {
    console.log('Custom points updated:', customPoints); // Log custom points update
  }, [customPoints]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left Panel */}
      <Paper
        elevation={3}
        sx={{
          width: 300,
          p: 3,
          bgcolor: 'background.paper',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* User info and logout button */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Welcome: {username}
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
            sx={{ mb: 1 }}
          >
            Logout
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PublicIcon />}
            onClick={() => navigate('/public-routes')}
            fullWidth
          >
            Popular Routes
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Route Name Input */}
        <TextField
          label="Route Name"
          variant="outlined"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Save Route Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveRoute}
          disabled={!routeName || selectedRestaurants.length === 0}
          fullWidth
          sx={{ mb: 3 }}
        >
          Save Route
        </Button>

        {/* Add Custom Point Form */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add Custom Point
          </Typography>
          
          <TextField
            label="Custom Point Name"
            variant="outlined"
            value={newPointName}
            onChange={(e) => setNewPointName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Click on map to select location
          </Typography>
          
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'background.default',
              borderRadius: 1,
              mb: 2,
              minHeight: '2rem'
            }}
          >
            {newPointLocation.lat && newPointLocation.lng
              ? `Selected: ${newPointLocation.lat.toFixed(4)}, ${newPointLocation.lng.toFixed(4)}`
              : 'No location selected'}
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCustomPoint}
            fullWidth
          >
            Add Custom Point
          </Button>
        </Paper>

        {/* Clear Selection Button */}
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ClearIcon />}
          onClick={() => setSelectedRestaurants([])}
          fullWidth
          sx={{ mb: 3 }}
        >
          Clear Selection
        </Button>

        {/* Display All Points (including custom points) with pagination */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Available Points
          </Typography>
          
          {/* Points List with Pagination */}
          <PaginatedPointsList 
            points={allPoints}
            selectedLocations={selectedRestaurants}
            onPointClick={handleRestaurantClick}
            onDeletePoint={handleDeleteCustomPoint}
            itemsPerPage={5}
          />
        </Box>

        {/* Saved routes list */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          Saved Routes
        </Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {savedRoutes.map(route => (
            <Paper
              key={route.route_id || route.createdAt}
              elevation={1}
              sx={{ mb: 1, overflow: 'hidden' }}
            >
              <ListItem
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 1.5
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' }
                    }}
                    onClick={() => loadSavedRoute(route)}
                  >
                    {route.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(route.created_at || route.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/routes/${route.route_id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Tooltip title="Delete route">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => openDeleteDialog(route.route_id, e)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      </Paper>

      {/* Map Component - Using fixed height container */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)', // Viewport height minus top navigation bar height
        maxHeight: 'calc(100vh - 64px)',
        border: '1px solid #ddd',
        borderRadius: '4px',
        m: 1, // Margin
        overflow: 'hidden' // Prevent content overflow
      }}>
        {locationLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Getting your location...
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Map Component */}
        <Box component="div" sx={{ 
          flexGrow: 1,
          '& > div': { 
            height: '100% !important', 
            width: '100% !important'
          }
        }}>
          <Map
            apikey={apikey}
            userPosition={userPosition}
            selectedLocations={selectedRestaurants}
            onMapClick={handleMapClick}
            customPoints={customPoints}
            restaurantList={restaurantList}
            loading={locationLoading}
          />
        </Box>
      </Box>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Route</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this route? This action cannot be undone.
          </DialogContentText>
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
      
      {/* Global notification message */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Main App component
function App() {
  // Define handleLoginSuccess function and pass it to LoginForm component
  const handleLoginSuccess = (userId, username) => {
    console.log("User logged in successfully:", userId, username);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  };

  return (
    <Router>
      <Routes>
        {/* Pass handleLoginSuccess to LoginForm component */}
        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MainApp />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes/:routeId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RouteDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/public-routes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PublicRoutesList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;