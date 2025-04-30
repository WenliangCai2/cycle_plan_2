import Map from './Map';
import React, { useState, useEffect } from 'react';
import RestaurantList from "./RestaurantList";
import LoginForm from './LoginForm';
import { createCustomPoint, getCustomPoints } from './api/customPointApi';
import { createRoute, getRoutes, deleteRoute } from './api/routeApi';
import { logout } from './api/authApi';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RouteDetail from './components/RouteDetail';
import PublicRoutesList from './components/PublicRoutesList';
import { message, Modal } from 'antd';

const apikey = '8kY020yd2oSy4ivQKBlxf_a5Bhtizzu0A9deSUakGz8';

// Default position if geolocation fails (Newcastle)
const defaultPosition = { lat: 54.9783, lng: -1.6174 };

// Empty restaurant list - no predefined locations
const restaurantList = [];

// Extract main app content into a separate component
const MainApp = () => {
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
    const username = localStorage.getItem('username') || 'User'; // Get username from localStorage

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
                    message.info("Using default location. Enable location services for better experience.");
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
            message.info("Geolocation not supported by your browser. Using default location.");
            setLocationLoading(false);
        }
    }, []);

    // Load user's custom points and routes
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Load custom points
                const pointsResponse = await getCustomPoints();
                if (pointsResponse.success) {
                    // 确保每个自定义点有正确的isCustom标记和point_id
                    const customPoints = (pointsResponse.customPoints || []).map(point => {
                        console.log("Processing custom point from backend:", point);
                        // Make sure each point has the required properties
                        return {
                            ...point,
                            isCustom: true, // 确保有isCustom标记
                            point_id: point.point_id, // 确保有point_id
                            location: point.location || {} // 确保location存在
                        };
                    });
                    console.log('Loaded custom points:', customPoints);
                    setCustomPoints(customPoints);
                } else {
                    console.error("Failed to load custom points:", pointsResponse.message);
                }
                
                // Load routes
                const routesResponse = await getRoutes();
                if (routesResponse.success) {
                    setSavedRoutes(routesResponse.routes || []);
                }
            } catch (error) {
                console.error('Failed to load user data:', error);
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

    // New: Save current route
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
                    message.success('Route saved successfully');
                } else {
                    console.error('Failed to save route:', response.message);
                    message.error('Failed to save route');
                }
                
                setRouteName('');
            } catch (error) {
                console.error('Error saving route:', error);
                message.error('Error saving route');
            }
        }
    };

    // New: Load saved route
    const loadSavedRoute = (route) => {
        setSelectedRestaurants(route.locations);
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
                    // 确保返回的点位有正确的属性
                    const savedPoint = {
                        ...(response.point || newPoint),
                        isCustom: true, // 确保有isCustom标记
                        point_id: response.point?.point_id || newPoint.point_id, // Ensure point_id exists
                    };
                    console.log('Saving point with data:', savedPoint);
                    setCustomPoints(prev => [...prev, savedPoint]);
                    message.success('Custom point added successfully');
                    
                    // Show instructions to the user about using the custom point
                    message.info('Click on the custom point to add it to your current route');
                } else {
                    console.error('Failed to save custom point:', response.message);
                    message.error('Failed to add custom point: ' + response.message);
                }
                
                setNewPointName('');
                setNewPointLocation({ lat: null, lng: null });
            } catch (error) {
                console.error('Error saving custom point:', error);
                message.error('Error adding custom point');
            }
        } else {
            console.error('Missing name or location'); // Log error
            message.warning('Please provide both a name and select a location on the map');
        }
    };

    // Handle map click event (to get custom point location)
    const handleMapClick = (lat, lng) => {
        console.log('Map click received:', lat, lng); // Log map click
        setNewPointLocation({ lat, lng });
    };

    // Handle route deletion using fetch API instead of axios
    const handleDeleteRoute = async (routeId, e) => {
        // 如果有事件对象传入，阻止事件冒泡
        if (e) {
            e.stopPropagation();
        }
        
        if (!routeId) {
            console.error("Cannot delete route: no route ID provided");
            message.error("Cannot delete route: missing ID");
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete this route? This action cannot be undone.`)) {
            try {
                console.log("Attempting to delete route with ID:", routeId);
                
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
                
                console.log("Delete route response status:", response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Delete route response data:", data);
                    
                    if (data.success) {
                        // Remove route from state
                        setSavedRoutes(prev => prev.filter(route => route.route_id !== routeId));
                        message.success('Route deleted successfully');
                    } else {
                        message.error(`Delete failed: ${data.message || 'Unknown error'}`);
                    }
                } else {
                    message.error(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error deleting route:', error);
                message.error(`Failed to delete route: ${error.message || 'Unknown error'}`);
            }
        }
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
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Left Panel */}
            <div style={{
                width: '300px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)'
            }}>
                {/* User info and logout button */}
                <div style={{marginBottom: '20px', textAlign: 'center'}}>
                    <h3 style={{margin: '0 0 10px 0'}}>Welcome: {username}</h3>
                    <button 
                        onClick={handleLogout}
                        style={{...styles.button, backgroundColor: '#dc3545'}}
                    >
                        Logout
                    </button>
                    <button 
                        onClick={() => navigate('/public-routes')}
                        style={{...styles.button, backgroundColor: '#28a745', marginTop: '10px'}}
                    >
                        Popular Routes
                    </button>
                </div>

                {/* Route Name Input */}
                <div style={{marginBottom: '20px'}}>
                    <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Enter route name"
                        style={styles.input}
                    />
                </div>

                {/* Save Route Button */}
                <button
                    onClick={handleSaveRoute}
                    style={styles.button}
                    disabled={!routeName || selectedRestaurants.length === 0}
                >
                    Save Route
                </button>

                {/* Add Custom Point Form */}
                <form onSubmit={handleAddCustomPoint} style={{marginBottom: '20px'}}>
                    <h3 style={styles.heading}>Add Custom Point</h3>
                    <input
                        type="text"
                        placeholder="Enter custom point name"
                        value={newPointName}
                        onChange={(e) => setNewPointName(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <div style={{marginTop: '10px'}}>
                        <span style={styles.label}>Click on map to select location</span>
                        <div style={styles.locationDisplay}>
                            {newPointLocation.lat && newPointLocation.lng
                                ? `Selected location: ${newPointLocation.lat.toFixed(4)}, ${newPointLocation.lng.toFixed(4)}`
                                : 'No location selected'}
                        </div>
                    </div>
                    <button
                        type="submit"
                        style={styles.button}
                    >
                        Add Custom Point
                    </button>
                </form>

                {/* Clear Selection Button */}
                <button
                    onClick={() => setSelectedRestaurants([])}
                    style={styles.button}
                >
                    Clear Selection
                </button>

                {/* Display All Points (including custom points) */}
                <RestaurantList
                    list={allPoints}
                    selectedLocations={selectedRestaurants}
                    onClickHandler={handleRestaurantClick}
                />
            </div>

            {/* Map Component */}
            <div style={{flex: 1}}>
                <Map
                    apikey={apikey}
                    userPosition={userPosition}
                    selectedLocations={selectedRestaurants}
                    onMapClick={handleMapClick}
                    customPoints={customPoints}
                    restaurantList={restaurantList}
                    loading={locationLoading}
                />
            </div>
            {/* New: Saved routes list */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={styles.heading}>Saved Routes</h3>
                <div style={styles.savedRoutesList}>
                    {savedRoutes.map(route => (
                        <div
                            key={route.route_id || route.createdAt}
                            style={styles.routeItem}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => loadSavedRoute(route)}
                                    >
                                        {route.name}
                                    </span>
                                    <small style={styles.dateText}>
                                        {new Date(route.created_at || route.createdAt).toLocaleDateString()}
                                    </small>
                                </div>
                                <div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/routes/${route.route_id}`);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            marginRight: '5px'
                                        }}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRoute(route.route_id, e);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main App component
function App() {
    // Define handleLoginSuccess function at App level
    const handleLoginSuccess = (userId, username) => {
        console.log("User logged in successfully:", userId, username);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <MainApp />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/routes/:routeId" 
                    element={
                        <RouteDetail />
                    } 
                />
                <Route 
                    path="/public-routes" 
                    element={
                        <PublicRoutesList />
                    } 
                />
            </Routes>
        </Router>
    );
}

// CSS Styles
const styles = {
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        marginBottom: '20px',
        transition: 'background-color 0.3s ease',
    },
    buttonHover: {
        backgroundColor: '#0056b3',
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px',
    },
    heading: {
        fontSize: '18px',
        marginBottom: '10px',
        color: '#333',
    },
    label: {
        fontSize: '14px',
        color: '#666',
    },
    locationDisplay: {
        padding: '10px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
        marginTop: '5px',
        fontSize: '14px',
        color: '#333',
    },
    savedRoutesList: {
        border: '1px solid #ddd',
        borderRadius: '5px',
        backgroundColor: '#fff',
    },
    routeItem: {
        padding: '10px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        '&:hover': {
            backgroundColor: '#f8f9fa'
        }
    },
    dateText: {
        color: '#666',
        fontSize: '0.8em',
        marginLeft: '8px'
    }
};

export default App;