/**
 * Main Application Component
 * =======================
 * This module serves as the entry point for the route planning application,
 * providing routing, authentication, and layout management.
 * 
 * Features:
 * - Route management with React Router
 * - Protected routes requiring authentication
 * - Global application layout with navigation header
 * - Responsive design with adaptive components
 * - User authentication state management
 * - Initial disclaimer acceptance handling
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
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
  Pagination,
  Menu,
  MenuItem,
  ListItemIcon
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
  NavigateNext as NextIcon,
  ExpandLess,
  ExpandMore,
  LocationOn,
  MyLocation
} from '@mui/icons-material';
import Map from './Map';
import RestaurantList from "./RestaurantList";
import LoginForm from './LoginForm';
import { createCustomPoint, getCustomPoints } from './api/customPointApi';
import { createRoute, getRoutes, deleteRoute, uploadRouteImage } from './api/routeApi';
import { logout } from './api/authApi';
import ProtectedRoute from './components/ProtectedRoute';
import RouteDetail from './components/RouteDetail';
import PublicRoutesList from './components/PublicRoutesList';
import MainPage from './components/MainPage';
// Import background image
import backgroundImage from './images/AdobeStock_1291231442_Preview.jpeg';

/**
 * API key for HERE Maps service
 * Used across the application for map-based functionality
 */
const apikey = 'RbwdXOHKZRDRFw0gKovUUV-eU_TiBYTSGrpRXbkv6MY';

/**
 * Default position coordinates
 * Used when geolocation fails or is unavailable
 * Set to Newcastle location as fallback
 */
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

/**
 * Empty restaurant list initialization
 * No predefined locations are used in this application
 */
const restaurantList = [];

/**
 * Saved Routes List Component
 * =======================
 * Displays user's saved routes with pagination and interactive controls.
 * 
 * Process:
 * 1. Renders paginated list of routes with route metadata
 * 2. Provides route loading and detail view functionality
 * 3. Implements expandable/collapsible interface
 * 4. Adapts styling based on context (map overlay or standalone)
 * 
 * Args:
 *   routes (Array): List of routes to display
 *   onLoadRoute (Function): Handler for loading a route
 *   onViewDetails (Function): Handler for viewing route details
 *   onDeleteDialog (Function): Handler for delete confirmation
 *   mapStyle (Boolean): Flag for map overlay styling mode
 * 
 * Returns:
 *   Paginated list of routes with controls and actions
 */
const SavedRoutesList = ({ routes, onLoadRoute, onViewDetails, onDeleteDialog, mapStyle = false }) => {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(routes.length / itemsPerPage);
  
  /**
   * Get current page routes based on pagination state
   * Slices the routes array to display only the current page items
   */
  const currentPageRoutes = routes.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );
  
  /**
   * Toggle expanded state of the component
   * Controls visibility of the route list body
   */
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

/**
 * Paginated Points List Component
 * =======================
 * Displays available points with pagination and selection functionality.
 * 
 * Process:
 * 1. Renders paginated list of location points
 * 2. Provides selection and deletion functionality
 * 3. Implements expandable/collapsible interface
 * 4. Adapts styling based on context (map overlay or standalone)
 * 
 * Args:
 *   points (Array): List of points to display
 *   selectedLocations (Array): Currently selected points
 *   onPointClick (Function): Handler for point selection
 *   itemsPerPage (Number): Items to display per page
 *   onDeletePoint (Function): Handler for point deletion
 *   mapStyle (Boolean): Flag for map overlay styling mode
 * 
 * Returns:
 *   Paginated list of points with selection controls
 */
const PaginatedPointsList = ({ points, selectedLocations, onPointClick, itemsPerPage = 5, onDeletePoint, mapStyle = false }) => {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const totalPages = Math.ceil(points.length / itemsPerPage);
  
  /**
   * Get current page points based on pagination state
   * Slices the points array to display only the current page items
   */
  const currentPagePoints = points.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );
  
  /**
   * Handle formal page change event
   * Updates current page number
   * 
   * Args:
   *   event (Event): Page change event
   *   newPage (Number): New page number
   */
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Toggle expanded state of the component
   * Controls visibility of the points list body
   */
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

/**
 * Application Header Component
 * =======================
 * Provides top navigation bar with tabs and user profile menu.
 * 
 * Process:
 * 1. Renders application title and navigation tabs
 * 2. Handles tab selection and navigation
 * 3. Displays user profile with dropdown menu
 * 4. Manages logout functionality
 * 
 * Returns:
 *   Header bar with navigation tabs and user profile
 */
const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const username = localStorage.getItem('username') || 'User';
  const [anchorEl, setAnchorEl] = useState(null);
  
  /**
   * Monitor route changes and update tab selection
   * 
   * Process:
   * 1. Watches location pathname changes
   * 2. Updates tab selection based on current route
   * 
   * Side effects:
   *   Updates tabValue state when route changes
   */
  useEffect(() => {
    if (location.pathname === '/mainPage') {
      setTabValue(0);
    } else if (location.pathname === '/public-routes') {
      setTabValue(1);
    }
  }, [location.pathname]);

  /**
   * Handle tab change
   * 
   * Process:
   * 1. Updates selected tab state
   * 2. Navigates to corresponding route
   * 
   * Args:
   *   event (Event): Tab change event
   *   newValue (Number): New tab index
   * 
   * Side effects:
   *   Updates tabValue state
   *   Navigates to new route
   */
  const handleChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate('/mainPage');
    } else if (newValue === 1) {
      navigate('/public-routes');
    }
  };
  
  /**
   * Handle profile menu click
   * 
   * Process:
   * 1. Sets menu anchor element for positioning
   * 
   * Args:
   *   event (Event): Click event
   * 
   * Side effects:
   *   Updates anchorEl state
   */
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  /**
   * Close profile menu
   * 
   * Process:
   * 1. Clears menu anchor element
   * 
   * Side effects:
   *   Updates anchorEl state to null
   */
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  /**
   * Handle user logout
   * 
   * Process:
   * 1. Calls logout API
   * 2. Clears local storage credentials
   * 3. Navigates to login page
   * 4. Handles errors gracefully
   * 
   * Side effects:
   *   Removes authentication data from localStorage
   *   Closes menu
   *   Navigates to login page
   */
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      handleClose();
      navigate('/login');
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
            <Tab icon={<PublicIcon />} label="Public Routes" />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="inherit" 
            onClick={handleProfileClick}
            sx={{ 
              textTransform: 'none', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <Typography variant="body1" sx={{ mr: 1 }}>
              {username}
            </Typography>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {username.charAt(0).toUpperCase()}
            </Avatar>
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

/**
 * Application Layout Component
 * =======================
 * Provides consistent layout structure for all protected pages.
 * 
 * Process:
 * 1. Applies background styling to entire application
 * 2. Includes fixed header with navigation
 * 3. Creates scrollable content area for page content
 * 
 * Args:
 *   children (Node): Page content to render within layout
 * 
 * Returns:
 *   Structured layout with header and content area
 */
const AppLayout = ({ children }) => {
  return (
    <Box
      sx={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <AppHeader />
      <Box sx={{ flexGrow: 1, overflow: 'auto', padding: 2 }}>
        {children}
      </Box>
    </Box>
  );
};

/**
 * Main Application Component
 * =======================
 * Primary component defining routes and application structure.
 * 
 * Process:
 * 1. Sets up application routes with protection
 * 2. Manages initial disclaimer acceptance
 * 3. Handles authentication and login success
 * 4. Provides global layout to authenticated routes
 * 
 * Returns:
 *   Complete application with routing and layout
 */
function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  /**
   * Check if disclaimer has been accepted
   * 
   * Process:
   * 1. Checks localStorage for disclaimer acceptance flag
   * 2. Shows disclaimer dialog if not previously accepted
   * 
   * Side effects:
   *   Sets showDisclaimer state based on localStorage
   */
  useEffect(() => {
    const accepted = localStorage.getItem('disclaimerAccepted');
    if (!accepted) {
      setShowDisclaimer(true);
    }
  }, []);

  /**
   * Handle disclaimer acceptance
   * 
   * Process:
   * 1. Sets localStorage flag for disclaimer acceptance
   * 2. Hides disclaimer dialog
   * 
   * Side effects:
   *   Updates localStorage with acceptance flag
   *   Sets showDisclaimer state to false
   */
  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  /**
   * Handle successful login
   * 
   * Process:
   * 1. Stores user credentials in localStorage
   * 2. Logs successful authentication
   * 
   * Args:
   *   userId (String): Authenticated user ID
   *   username (String): Authenticated username
   * 
   * Side effects:
   *   Updates localStorage with user credentials
   */
  const handleLoginSuccess = (userId, username) => {
    console.log("User logged in successfully:", userId, username);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  };

  return (
    <Router>
      <Routes>
        {/* Root path redirects to login page */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Login page - public route */}
        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Main page - protected route with layout */}
        <Route
          path="/mainPage"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MainPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Route details page - protected route with layout */}
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
        
        {/* Public routes listing page - protected route with layout */}
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
        
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Disclaimer dialog - shown on first visit */}
      <Dialog open={showDisclaimer} disableEscapeKeyDown>
        <DialogTitle>Disclaimer</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This route information is provided for reference only.
          </Typography>
          <Typography gutterBottom>
            Safety and accuracy of the route cannot be guaranteed.
          </Typography>
          <Typography gutterBottom>
            Users should assess local conditions and ride at their own risk.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAcceptDisclaimer} variant="contained" color="primary">
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </Router>
  );
}

export default App;