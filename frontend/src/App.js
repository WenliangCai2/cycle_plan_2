import Map from './Map';
import React, { useState, useEffect } from 'react';
import RestaurantList from "./RestaurantList";
import LoginForm from './LoginForm';
import { createCustomPoint, getCustomPoints, deleteCustomPoint } from './api/customPointApi';
import { createRoute, getRoutes, deleteRoute } from './api/routeApi';
import { logout } from './api/authApi';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RouteDetail from './components/RouteDetail';
import PublicRoutesList from './components/PublicRoutesList';
import { message } from 'antd';

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
                    setCustomPoints(pointsResponse.customPoints || []);
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
    const handleLoginSuccess = (newUserId) => {
        localStorage.setItem('userId', newUserId);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('userId');
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
                const newRoute = {
                    name: routeName,
                    locations: [...selectedRestaurants], // Copy current selected locations
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
                    // If backend returns a point object with id, use it, otherwise use locally created
                    const savedPoint = response.point || newPoint;
                    setCustomPoints(prev => [...prev, savedPoint]);
                } else {
                    console.error('Failed to save custom point:', response.message);
                }
                
                setNewPointName('');
                setNewPointLocation({ lat: null, lng: null });
            } catch (error) {
                console.error('Error saving custom point:', error);
            }
        } else {
            console.error('Missing name or location'); // Log error
        }
    };

    // Handle map click event (to get custom point location)
    const handleMapClick = (lat, lng) => {
        console.log('Map click received:', lat, lng); // Log map click
        setNewPointLocation({ lat, lng });
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
                    <h3 style={{margin: '0 0 10px 0'}}>Welcome User: {userId}</h3>
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
                                <button
                                    onClick={() => navigate(`/routes/${route.route_id}`)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    View Details
                                </button>
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
    // 在App级别定义handleLoginSuccess函数
    const handleLoginSuccess = (userId) => {
        console.log("User logged in successfully:", userId);

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