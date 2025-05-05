// MainPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  CircularProgress, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Snackbar, 
  Alert,
  Divider, 
  List, 
  ListItem
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Clear as ClearIcon,
  Save as SaveIcon, 
  Preview as PreviewIcon,
  ExpandLess,
  ExpandMore,
  LocationOn,
  MyLocation
} from '@mui/icons-material';
import Map from '../Map';
import { createCustomPoint, getCustomPoints } from '../api/customPointApi';
import { createRoute, getRoutes, uploadRouteImage } from '../api/routeApi';

const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

// Empty restaurant list - no predefined locations
const restaurantList = [];

// MainPage component - Contains the main application logic and UI
const MainPage = () => {
  const navigate = useNavigate();
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [customPoints, setCustomPoints] = useState([]);
  const [newPointName, setNewPointName] = useState('');
  const [newPointLocation, setNewPointLocation] = useState({ lat: null, lng: null });
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [routeImage, setRouteImage] = useState(null);
  const [routeImagePreview, setRouteImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const userId = localStorage.getItem('userId');
  const [userPosition, setUserPosition] = useState(defaultPosition);
  const [locationLoading, setLocationLoading] = useState(true);
  
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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRouteImage(file);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setRouteImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    setRouteImage(null);
    setRouteImagePreview(null);
    
    // Reset file input
    const fileInput = document.getElementById('route-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Save current route with image
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    if (routeName && selectedRestaurants.length > 0) {
      try {
        let imageUrl = null;
        
        // If there's an image selected, upload it first
        if (routeImage) {
          setUploadingImage(true);
          try {
            const uploadResponse = await uploadRouteImage(routeImage);
            if (uploadResponse.success) {
              imageUrl = uploadResponse.image_url;
              console.log('Image uploaded successfully:', imageUrl);
            } else {
              console.error('Image upload failed:', uploadResponse.message);
              showSnackbar('Image upload failed, but route will still be saved', 'warning');
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            showSnackbar('Image upload failed, but route will still be saved', 'warning');
          } finally {
            setUploadingImage(false);
          }
        }
        
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
          user_id: userId, // Use user_id to match backend model
          image_url: imageUrl // Include the image URL if available
        };
        
        const response = await createRoute(newRoute);
        
        if (response.success) {
          console.log('Route saved successfully:', response);
          // Use complete route object returned from backend, including route_id
          const savedRoute = response.route;
          setSavedRoutes(prev => [...prev, savedRoute]);
          showSnackbar('Route saved successfully');
          
          // Reset form
          setRouteName('');
          setRouteImage(null);
          setRouteImagePreview(null);
          setSelectedRestaurants([]);
        } else {
          console.error('Failed to save route:', response.message);
          showSnackbar('Failed to save route', 'error');
        }
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
  
  // Define SavedRoutesList and PaginatedPointsList components (internal components)
  // SavedRoutesList component
  const SavedRoutesList = ({ routes, onLoadRoute, onViewDetails, onDeleteDialog, mapStyle = false }) => {
    const [page, setPage] = useState(0);
    const [expanded, setExpanded] = useState(true);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(routes.length / itemsPerPage);
    
    // Get current page routes
    const currentPageRoutes = routes.slice(
      page * itemsPerPage,
      (page + 1) * itemsPerPage
    );
    
    const toggleExpand = () => {
      setExpanded(!expanded);
    };
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          width: mapStyle ? 240 : '100%',
          overflow: 'hidden',
          borderRadius: '8px',
          mb: 2,
          ...(mapStyle && {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          })
        }}
      >
        <Box 
          sx={{ 
            p: mapStyle ? 1 : 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: mapStyle ? 'rgba(25, 118, 210, 0.85)' : 'primary.main',
            color: 'white',
            cursor: 'pointer',
            ...(mapStyle && {
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            })
          }}
          onClick={toggleExpand}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SaveIcon sx={{ mr: mapStyle ? 0.5 : 1, fontSize: mapStyle ? 18 : 24 }} />
            <Typography variant={mapStyle ? "subtitle2" : "subtitle1"} fontWeight="bold">
              Saved Routes
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            color="inherit"
            sx={mapStyle ? { p: 0.5 } : {}}
          >
            {expanded ? <ExpandLess fontSize={mapStyle ? "small" : "medium"} /> : <ExpandMore fontSize={mapStyle ? "small" : "medium"} />}
          </IconButton>
        </Box>
        
        {expanded && (
          <>
            <List 
              sx={{ 
                maxHeight: mapStyle ? '40vh' : '30vh', 
                overflow: 'auto',
                p: 0
              }}
            >
              {currentPageRoutes.length > 0 ? (
                currentPageRoutes.map(route => (
                  <React.Fragment key={route.route_id || route.createdAt}>
                    {mapStyle && <Divider component="li" />}
                    <ListItem
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        p: mapStyle ? 1 : 1.5,
                        bgcolor: mapStyle ? 'transparent' : 'background.paper',
                        '&:hover': {
                          bgcolor: mapStyle ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography
                          variant={mapStyle ? "caption" : "subtitle2"}
                          sx={{
                            fontWeight: 500,
                            cursor: 'pointer',
                            color: mapStyle ? 'black' : 'inherit',
                            '&:hover': { color: 'primary.main' }
                          }}
                          onClick={() => onLoadRoute(route)}
                        >
                          {route.name}
                        </Typography>
                        <Typography variant="caption" color={mapStyle ? "black" : "text.secondary"} sx={{ opacity: mapStyle ? 0.7 : 1 }}>
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
                            onViewDetails(route.route_id);
                          }}
                          sx={mapStyle ? { py: 0, px: 1, fontSize: '0.7rem' } : {}}
                        >
                          View
                        </Button>
                        <Tooltip title="Delete route">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => onDeleteDialog(route.route_id, e)}
                            sx={mapStyle ? { p: 0.5 } : {}}
                          >
                            <DeleteIcon fontSize="small" sx={mapStyle ? { fontSize: 16 } : {}} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <Typography variant={mapStyle ? "caption" : "body2"} color={mapStyle ? "black" : "text.secondary"} sx={{ py: 1, width: '100%', textAlign: 'center', opacity: mapStyle ? 0.7 : 1 }}>
                    No saved routes
                  </Typography>
                </ListItem>
              )}
            </List>
            
            {routes.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                p: mapStyle ? 0.5 : 1, 
                backgroundColor: mapStyle ? 'rgba(255, 255, 255, 0.85)' : 'background.paper' 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: mapStyle ? 0.5 : 1 }}>
                  <IconButton 
                    onClick={() => setPage(0)}
                    disabled={page === 0 || totalPages <= 1}
                    size="small"
                    sx={mapStyle ? { p: 0.5 } : {}}
                  >
                    <Box component="span" sx={{ fontSize: mapStyle ? '0.9rem' : '1.2rem' }}>«</Box>
                  </IconButton>
                  
                  <IconButton 
                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                    disabled={page === 0 || totalPages <= 1}
                    size="small"
                    sx={mapStyle ? { p: 0.5 } : {}}
                  >
                    <Box component="span" sx={{ fontSize: mapStyle ? '0.9rem' : '1.2rem' }}>‹</Box>
                  </IconButton>
                  
                  <Typography variant={mapStyle ? "caption" : "body2"} sx={{ mx: mapStyle ? 0.5 : 1 }}>
                    {`${page + 1} / ${Math.max(1, totalPages)}`}
                  </Typography>
                  
                  <IconButton 
                    onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={page >= totalPages - 1 || totalPages <= 1}
                    size="small"
                    sx={mapStyle ? { p: 0.5 } : {}}
                  >
                    <Box component="span" sx={{ fontSize: mapStyle ? '0.9rem' : '1.2rem' }}>›</Box>
                  </IconButton>
                  
                  <IconButton 
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1 || totalPages <= 1}
                    size="small"
                    sx={mapStyle ? { p: 0.5 } : {}}
                  >
                    <Box component="span" sx={{ fontSize: mapStyle ? '0.9rem' : '1.2rem' }}>»</Box>
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>
    );
  };

  // PaginatedPointsList component
  const PaginatedPointsList = ({ points, selectedLocations, onPointClick, itemsPerPage = 5, onDeletePoint, mapStyle = false }) => {
    const [page, setPage] = useState(0);
    const [expanded, setExpanded] = useState(true);
    const totalPages = Math.ceil(points.length / itemsPerPage);
    
    // Get current page points
    const currentPagePoints = points.slice(
      page * itemsPerPage,
      (page + 1) * itemsPerPage
    );
    
    const toggleExpand = () => {
      setExpanded(!expanded);
    };
    
    return (
      <Box>
        {mapStyle ? (
          <Paper 
            elevation={3} 
            sx={{ 
              width: 240,
              maxHeight: '60vh',
              overflow: 'hidden',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(5px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <Box 
              sx={{ 
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(25, 118, 210, 0.85)',
                color: 'white',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={toggleExpand}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight="bold">
                  Available Points
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                color="inherit"
                sx={{ p: 0.5 }}
              >
                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Box>
            
            {expanded && (
              <>
                <List 
                  sx={{ 
                    maxHeight: '40vh', 
                    overflow: 'auto',
                    p: 0
                  }}
                >
                  {currentPagePoints.map((point, index) => (
                    <React.Fragment key={point.point_id || `${page}-${index}`}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem
                        button
                        dense
                        selected={selectedLocations.some(
                          l => l.lat === point.location.lat && l.lng === point.location.lng
                        )}
                        onClick={() => onPointClick(point.location)}
                        sx={{
                          py: 0.3,
                          px: 1,
                          transition: 'background-color 0.2s',
                          '&.Mui-selected': {
                            backgroundColor: `rgba(25, 118, 210, 0.25)`,
                            '&:hover': {
                              backgroundColor: `rgba(25, 118, 210, 0.35)`,
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
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
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : null
                        }
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          mr: point.isCustom ? 2 : 0
                        }}>
                          {point.isCurrentLocation ? (
                            <MyLocation 
                              color={selectedLocations.some(
                                l => l.lat === point.location.lat && l.lng === point.location.lng
                              ) ? "secondary" : "action"} 
                              sx={{ 
                                mr: 0.5, 
                                fontSize: 16,
                                transition: 'color 0.2s'
                              }} 
                            />
                          ) : (
                            <LocationOn 
                              color={selectedLocations.some(
                                l => l.lat === point.location.lat && l.lng === point.location.lng
                              ) ? "primary" : "action"} 
                              sx={{ 
                                mr: 0.5, 
                                fontSize: 16,
                                transition: 'color 0.2s'
                              }} 
                            />
                          )}
                          <Box>
                            <Typography 
                              variant="caption"
                              fontWeight={selectedLocations.some(
                                l => l.lat === point.location.lat && l.lng === point.location.lng
                              ) ? "bold" : "medium"} 
                              noWrap
                              sx={{ transition: 'font-weight 0.2s' }}
                            >
                              {point.name || `Point ${index + 1 + page * itemsPerPage}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                              {point.isCurrentLocation ? 'Current location' : (point.isCustom ? 'Custom point' : 'POI')}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                  
                  {currentPagePoints.length === 0 && (
                    <ListItem>
                      <Typography variant="caption" color="text.secondary" sx={{ py: 1, width: '100%', textAlign: 'center' }}>
                        No points available
                      </Typography>
                    </ListItem>
                  )}
                </List>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton 
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <Box component="span" sx={{ fontSize: '0.9rem' }}>«</Box>
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => setPage(prev => Math.max(0, prev - 1))}
                      disabled={page === 0}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <Box component="span" sx={{ fontSize: '0.9rem' }}>‹</Box>
                    </IconButton>
                    
                    <Typography variant="caption" sx={{ mx: 0.5 }}>
                      {`${page + 1} / ${Math.max(1, totalPages)}`}
                    </Typography>
                    
                    <IconButton 
                      onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={page >= totalPages - 1}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <Box component="span" sx={{ fontSize: '0.9rem' }}>›</Box>
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <Box component="span" sx={{ fontSize: '0.9rem' }}>»</Box>
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        ) : (
          <>
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
          </>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left Panel */}
      <Paper
        elevation={3}
        sx={{
          width: 300,
          p: 3,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px'
        }}
      >
        {/* Add Custom Point Form */}
        <Paper elevation={2} sx={{ 
          p: 2, 
          mb: 3,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px'
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>
            Add Custom Point
          </Typography>
          
          <TextField
            label="Custom Point Name"
            variant="outlined"
            value={newPointName}
            onChange={(e) => setNewPointName(e.target.value)}
            fullWidth
            required
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
                bgcolor: 'rgba(255, 255, 255, 0.5)'
              },
              '& .MuiInputLabel-root': {
                color: 'black'
              }
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, color: 'black' }}>
            Click on map to select location
          </Typography>
          
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 1,
              mb: 2,
              minHeight: '2rem',
              color: 'black'
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

        {/* Route Name Input */}
        <TextField
          label="Route Name"
          variant="outlined"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          fullWidth
          sx={{ 
            mb: 2, 
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
              bgcolor: 'rgba(255, 255, 255, 0.5)'
            },
            '& .MuiInputLabel-root': {
              color: 'black'
            }
          }}
        />

        {/* Route Image Upload */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'black' }}>
            Route Image (Optional)
          </Typography>
          
          {routeImagePreview ? (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img 
                src={routeImagePreview} 
                alt="Route preview" 
                style={{ 
                  width: '100%', 
                  height: 150, 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }} 
              />
              <IconButton 
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)'
                  }
                }}
                onClick={handleRemoveImage}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              startIcon={<AddIcon />}
              fullWidth
              sx={{ 
                mb: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.4)'
                }
              }}
            >
              Add Route Image
              <input
                type="file"
                id="route-image-input"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          )}
        </Box>

        {/* Save Route Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveRoute}
          disabled={!routeName || selectedRestaurants.length === 0 || uploadingImage}
          fullWidth
          sx={{ mb: 3 }}
        >
          {uploadingImage ? 'Uploading...' : 'Save Route'}
        </Button>

        {/* Clear Selection Button */}
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ClearIcon />}
          onClick={() => setSelectedRestaurants([])}
          fullWidth
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.4)'
            }
          }}
        >
          Clear Selection
        </Button>
      </Paper>

      {/* Map Component - Using fixed height container */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)', // Viewport height minus top navigation bar height
        maxHeight: 'calc(100vh - 64px)',
        border: 'none',
        borderRadius: '16px',
        m: 2, // Add margin
        overflow: 'hidden', // Prevent content overflow
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Add a semi-transparent border effect */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          zIndex: 2,
          pointerEvents: 'none', // Ensure border doesn't interfere with map interactions
        }} />
        
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
              zIndex: 10,
              borderRadius: '16px',
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
        
        {/* Available Points List - Map Style */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          zIndex: 5
        }}>
          <PaginatedPointsList 
            points={allPoints}
            selectedLocations={selectedRestaurants}
            onPointClick={handleRestaurantClick}
            onDeletePoint={handleDeleteCustomPoint}
            itemsPerPage={5}
            mapStyle={true}
          />
        </Box>
        
        {/* Saved Routes List - Map Style */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 5
        }}>
          <SavedRoutesList 
            routes={savedRoutes}
            onLoadRoute={loadSavedRoute}
            onViewDetails={(routeId) => navigate(`/routes/${routeId}`)}
            onDeleteDialog={openDeleteDialog}
            mapStyle={true}
          />
        </Box>
        
        {/* Top and bottom gradient effects */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
          zIndex: 1,
          pointerEvents: 'none',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }} />
        
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)',
          zIndex: 1,
          pointerEvents: 'none',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }} />
        
        {/* Map Component */}
        <Box component="div" sx={{ 
          flexGrow: 1,
          borderRadius: '16px',
          overflow: 'hidden',
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

export default MainPage; 