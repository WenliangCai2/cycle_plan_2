// App.js Complete Version - Using Material-UI Components
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

const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

// Empty restaurant list - no predefined locations
const restaurantList = [];

// Modify SavedRoutesList component to match PaginatedPointsList appearance and semi-transparent effect
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

// Modify the PaginatedPointsList component to enhance click feedback
const PaginatedPointsList = ({ points, selectedLocations, onPointClick, itemsPerPage = 5, onDeletePoint, mapStyle = false }) => {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(true);
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

// AppHeader Component - Add top navigation bar without affecting original functionality
const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const username = localStorage.getItem('username') || 'User';
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Monitor route changes, update tab status
  useEffect(() => {
    if (location.pathname === '/mainPage') {
      setTabValue(0);
    } else if (location.pathname === '/public-routes') {
      setTabValue(1);
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate('/mainPage');
    } else if (newValue === 1) {
      navigate('/public-routes');
    }
  };
  
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
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

// Layout component wrapping application content
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

// Main App component
function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimerAccepted');
    if (!accepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  // Define handleLoginSuccess function and pass it to LoginForm component
  const handleLoginSuccess = (userId, username) => {
    console.log("User logged in successfully:", userId, username);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  };

  return (
    <Router>
      <Routes>
        {/* Root path directly shows login page */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* Login page separate route */}
        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
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