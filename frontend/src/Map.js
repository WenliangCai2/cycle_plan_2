/**
 * Map Component
 * =======================
 * This module provides an interactive map interface using the HERE Maps API,
 * with features for route planning, location marking, and points of interest discovery.
 * 
 * Features:
 * - Interactive map with HERE Maps integration
 * - Custom marker creation and management
 * - Route calculation and visualization
 * - Points of Interest (POI) discovery along routes
 * - Info bubbles with location details
 * - User geolocation display
 * - Map click event handling
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import H from '@here/maps-api-for-javascript';
import { getCustomMarkerIcon } from './components/CustomMapMarker';
import { createInfoBubbleContent } from './components/CustomInfoBubble';
import './components/MapStyles.css';
import { CircularProgress, Typography } from '@mui/material';

/**
 * Map Component
 * 
 * Process:
 * 1. Initializes HERE Maps API with provided API key
 * 2. Renders an interactive map with user location
 * 3. Displays custom points and selected locations
 * 4. Calculates and displays routes between selected points
 * 5. Discovers points of interest along routes
 * 6. Provides location information via interactive markers
 * 
 * Args:
 *   apikey (String): HERE Maps API key
 *   userPosition (Object): User's current location coordinates {lat, lng}
 *   selectedLocations (Array): Array of selected locations for routing
 *   onMapClick (Function): Handler for map click events
 *   customPoints (Array): Array of custom points to display
 *   restaurantList (Array): Array of restaurant locations
 *   loading (Boolean): Loading state indicator
 * 
 * Ref Methods:
 *   clearAllSelections: Function to clear all selections from the map
 * 
 * Returns:
 *   Interactive map component with markers and routes
 */
const Map = forwardRef((props, ref) => {
    const mapRef = useRef(null);
    const map = useRef(null);
    const platform = useRef(null);
    const routePolyline = useRef(null);
    const ui = useRef(null);
    const [poiMarkers, setPoiMarkers] = useState([]);
    const [poiRadius, setPoiRadius] = useState(10);
    const [poiCategory, setPoiCategory] = useState('restaurants');
    const [processedPOIs, setProcessedPOIs] = useState(new Set());

    const { apikey, userPosition, selectedLocations, onMapClick, customPoints, restaurantList, loading } = props;
 

/**
     * Expose methods to parent component via ref
     * 
     * Methods:
     *   clearAllSelections: Clears all selections, routes and POI markers from the map
     */
useImperativeHandle(ref, () => ({
    clearAllSelections: () => {
        clearAllSelections();
    }
}));

/**
 * POI categories mapping
 * Maps human-readable category names to HERE API category codes
 */
const poiCategories = {
    "restaurants": "100-1000",
    "coffee-tea": "100-1100",
    "shopping": "200-0000",
    "sights-museums": "300-0000",
    "accommodation": "500-0000",
    "leisure-outdoor": "550-0000",
    "transport": "400-0000"
};

/**
 * Creates a POI control panel interface for the map
 * 
 * Process:
 * 1. Creates a container div for the control panel
 * 2. Sets up UI controls for POI radius and category selection
 * 3. Attaches event handlers to control elements
 * 4. Prevents map events from propagating through the panel
 * 
 * Side effects:
 *   Adds DOM elements to the map container
 *   Sets up event listeners for POI controls
 */
const createPOIControlPanel = () => {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'poi-control-panel';
    // Add positioning style to place the control panel in the bottom left corner
    controlContainer.style.top = 'auto';
    controlContainer.style.right = 'auto';
    controlContainer.style.bottom = '16px';
    controlContainer.style.left = '16px';
    
    controlContainer.innerHTML = `
        <div class="poi-controls">
            <h3>Points of Interest</h3>
            <div>
                <label for="poi-radius">Radius (meters): <span id="radius-value">${poiRadius}</span></label>
                <input type="range" id="poi-radius" min="10" max="2000" step="10" value="${poiRadius}">
            </div>
            <div>
                <label for="poi-category">Category:</label>
                <select id="poi-category">
                    ${Object.keys(poiCategories).map(cat =>
                        `<option value="${cat}" ${poiCategory === cat ? 'selected' : ''}>${cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`
                    ).join('')}
                </select>
            </div>
            <button id="update-poi">Update POIs</button>
        </div>
    `;

    // Add to the map container
    mapRef.current.appendChild(controlContainer);
    
    // Prevent map click events when interacting with the control panel
    controlContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Prevent touch events from propagating
    controlContainer.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    
    // Prevent mouse events from propagating
    controlContainer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // Add event listeners
    document.getElementById('poi-radius').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('radius-value').textContent = value;
        setPoiRadius(parseInt(value));
    });
   
    document.getElementById('poi-category').addEventListener('change', function() {
        setPoiCategory(this.value);
    });
   
    document.getElementById('update-poi').addEventListener('click', function() {
        findPOIsAlongRoute();
    });
};

/**
 * Clears existing POI markers from the map
 * 
 * Process:
 * 1. Gets all current map objects
 * 2. Removes only POI markers that still exist on the map
 * 3. Resets POI markers state and processed POIs set
 * 
 * Side effects:
 *   Removes POI marker objects from the map
 *   Updates poiMarkers state to empty array
 *   Resets processedPOIs set
 */
const clearPOIs = () => {
    if (map.current && poiMarkers.length > 0) {
        // Get current map objects
        const currentMapObjects = map.current.getObjects();
        
        // Only remove markers that still exist on the map
        poiMarkers.forEach(marker => {
            if (currentMapObjects.indexOf(marker) !== -1) {
                map.current.removeObject(marker);
            }
        });
        
        setPoiMarkers([]);
        setProcessedPOIs(new Set());
    }
};

/**
 * Clears existing route polyline from the map
 * 
 * Process:
 * 1. Removes route polyline object from the map if it exists
 * 2. Resets routePolyline reference
 * 
 * Side effects:
 *   Removes route polyline object from the map
 *   Sets routePolyline.current to null
 */
const clearRoute = () => {
    if (map.current && routePolyline.current) {
        map.current.removeObject(routePolyline.current);
        routePolyline.current = null;
    }
};

/**
 * Clears all selections, including POIs and route
 * 
 * Process:
 * 1. Calls clearPOIs to remove all POI markers
 * 2. Calls clearRoute to remove the route polyline
 * 
 * Side effects:
 *   Removes POI markers and route polyline from the map
 */
const clearAllSelections = () => {
    clearPOIs();
    clearRoute();
};
 
/**
     * Gets color for POI category
     * 
     * Process:
     * 1. Maps category names to specific colors for visual distinction
     * 2. Returns default color if category not found
     * 
     * Args:
     *   category (String): POI category name
     * 
     * Returns:
     *   String: Color hex code for the category
     */
const getCategoryColor = (category) => {
    const colors = {
        "restaurants": "#E02A2A",
        "coffee-tea": "#A52A2A",
        "shopping": "#4A90E2",
        "sights-museums": "#4CAF50",
        "accommodation": "#FF9800",
        "leisure-outdoor": "#8BC34A",
        "transport": "#9C27B0"
    };
   
    return colors[category] || "#000000";
};

/**
 * Creates a custom icon for POI markers
 * 
 * Process:
 * 1. Sets icon color to blue to differentiate from custom points
 * 2. Uses pin marker type for POIs
 * 3. Calls getCustomMarkerIcon utility with appropriate parameters
 * 
 * Args:
 *   category (String): POI category name (currently unused)
 * 
 * Returns:
 *   Object: HERE Maps icon object for POI markers
 */
const createPOIIcon = (category) => {
    // Use blue color for POI markers to differentiate from custom points
    const iconColor = '#4A90E2'; // Blue color
    // Use pin instead of star
    return getCustomMarkerIcon(H, iconColor, 'pin', { size: 28 });
};

/**
 * Shows info bubble for a marker with appropriate content
 * 
 * Process:
 * 1. Extracts marker data including title and website
 * 2. Creates customized info bubble content
 * 3. Positions the bubble above the marker
 * 4. Adds close button functionality
 * 5. Handles errors gracefully
 * 
 * Args:
 *   marker (Object): HERE Maps marker object
 *   position (Object): Position coordinates {lat, lng}
 * 
 * Side effects:
 *   Removes any existing info bubbles
 *   Adds new info bubble to the map UI
 */
const showMarkerInfoBubble = (marker, position) => {
    try {
        console.log("Showing info bubble for marker");
        // Get marker data
        const markerData = marker.getData();
        console.log("Marker data:", markerData);
        
        // Extract data
        let title = '';
        let website = '';
        
        if (typeof markerData === 'string') {
            // Simple string data
            title = markerData;
        } else if (markerData && typeof markerData === 'object') {
            // Object data - extract name/title
            title = markerData.name || markerData.title || 'Unnamed Location';
            
            // Extract website if exists
            website = markerData.website || markerData.url || '';
        } else {
            // Default value
            title = 'Location Point';
        }
        
        // Prepare data for info bubble
        const bubbleData = { 
            title: title,
            website: website
        };
        
        console.log("Creating info bubble with title:", title);
        
        // Create custom content with proper styling for the close button
        let bubbleContent;
        if (website) {
            bubbleContent = `
            <div class="info-bubble-content" style="position: relative; padding: 10px; min-width: 150px;">
                <div class="info-title" style="margin-right: 20px; font-weight: bold;">${title}</div>
                <a href="${website}" target="_blank" class="info-website" style="color: #4A90E2; text-decoration: underline;">Official Website</a>
                <div class="info-bubble-close-btn" style="position: absolute; top: 5px; right: 8px; cursor: pointer; font-size: 16px; line-height: 16px;">×</div>
            </div>`;
        } else {
            bubbleContent = createInfoBubbleContent(bubbleData);
        }
        
        // Create info bubble - set small offset to position bubble closer to marker
        const infoBubble = new H.ui.InfoBubble(position, {
            content: bubbleContent,
            // Set bubble offset to position it directly above the marker
            offset: { x: 0, y: -5 }
        });
        
        // Remove existing bubbles
        ui.current.getBubbles().forEach(bubble => {
            ui.current.removeBubble(bubble);
        });
        
        // Add new bubble
        ui.current.addBubble(infoBubble);
        console.log("Info bubble added");
        
        // Add event listener for the close button
        setTimeout(() => {
            const closeButton = document.querySelector('.info-bubble-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event from bubbling up
                    // Close the bubble by removing it from the UI
                    ui.current.getBubbles().forEach(bubble => {
                        ui.current.removeBubble(bubble);
                    });
                });
            }
        }, 10); // Small timeout to ensure the button is in the DOM
    } catch (e) {
        console.error("Error showing marker info bubble:", e);
    }
};

/**
 * Adds a POI marker to the map
 * 
 * Process:
 * 1. Creates a marker at the POI position
 * 2. Sets the appropriate icon based on category
 * 3. Attaches POI data to the marker
 * 4. Sets up tap event listener for info bubble display
 * 5. Adds marker to map and to poiMarkers state
 * 
 * Args:
 *   poi (Object): POI data object with position and metadata
 * 
 * Side effects:
 *   Adds marker object to the map
 *   Updates poiMarkers state
 */
const addPOIMarker = (poi) => {
    if (!map.current) return;
   
    const poiPosition = {
        lat: poi.position[0],
        lng: poi.position[1]
    };
   
    try {
        console.log("Adding POI marker:", poi.title || poi.name);
        // Create marker
        const poiMarker = new H.map.Marker(poiPosition, {
            icon: createPOIIcon(poiCategory)
        });
       
        // Add data to the marker
        poiMarker.setData(poi);
       
        // Add tap event to marker directly
        poiMarker.addEventListener('tap', (evt) => {
            try {
                const position = {
                    lat: poiMarker.getGeometry().lat,
                    lng: poiMarker.getGeometry().lng
                };
                // Use custom info bubble function
                showMarkerInfoBubble(poiMarker, position);
                
                // Prevent automatic map center reset and event propagation
                evt.stopPropagation();
            } catch (e) {
                console.error("Error showing POI info bubble:", e);
            }
        });
       
        // Add to map and to our markers array
        map.current.addObject(poiMarker);
        setPoiMarkers(prevMarkers => [...prevMarkers, poiMarker]);
        console.log("POI marker added");
    } catch (e) {
        console.error("Error adding POI marker:", e);
    }
};
 
/**
     * Finds POIs along the calculated route
     * 
     * Process:
     * 1. Clears existing POI markers
     * 2. Validates route polyline exists
     * 3. Extracts route points to create a corridor
     * 4. Constructs a corridor string for API query
     * 5. Initiates POI search along the corridor
     * 
     * Side effects:
     *   Clears existing POI markers
     *   Initializes corridor search for POIs
     */
const findPOIsAlongRoute = () => {
    clearPOIs();
   
    if (!routePolyline.current || !map.current) {
        console.warn('No route available to search for POIs');
        return;
    }
    
    // Get route geometry
    const routeGeometry = routePolyline.current.getGeometry();
    if (!routeGeometry || typeof routeGeometry.extractPoints !== 'function') {
        console.warn('Invalid route geometry');
        return;
    }
    
    const routePoints = routeGeometry.extractPoints();
    if (!routePoints || routePoints.getPointCount() === 0) {
        console.warn('No points in route geometry');
        return;
    }
    
    // Create a route corridor string for the API
    // Format: lat,lng;lat,lng;lat,lng...
    const sampleStep = Math.max(1, Math.floor(routePoints.getPointCount() / 20));
    let corridorPoints = [];
    
    for (let i = 0; i < routePoints.getPointCount(); i += sampleStep) {
        const point = routePoints.get(i);
        corridorPoints.push(`${point.lat},${point.lng}`);
    }
    
    // Make sure to include the last point
    const lastPoint = routePoints.get(routePoints.getPointCount() - 1);
    if (!corridorPoints.includes(`${lastPoint.lat},${lastPoint.lng}`)) {
        corridorPoints.push(`${lastPoint.lat},${lastPoint.lng}`);
    }
    
    const corridor = corridorPoints.join(';');
    console.log("Route corridor:", corridor);
    
    // Search for POIs along the corridor
    searchPOIsAlongCorridor(corridor, poiRadius);
};

/**
 * Searches for POIs along a route corridor
 * 
 * Process:
 * 1. Makes API requests to HERE Browse service
 * 2. Searches for multiple POI categories
 * 3. Processes results and adds markers for found POIs
 * 4. Tracks processed POIs to avoid duplicates
 * 5. Handles errors gracefully
 * 
 * Args:
 *   corridor (String): Formatted corridor string for route
 *   radius (Number): Search radius in meters
 * 
 * Side effects:
 *   Adds POI markers to the map
 *   Updates processedPOIs set with found POI IDs
 */
const searchPOIsAlongCorridor = (corridor, radius) => {
    console.log(`[DEBUG] Starting corridor search with radius: ${radius}m and corridor length: ${corridor.split(';').length} points`);
    
    // HERE API category codes for better results
    const categoryMap = {
        "restaurant": "100-1000",
        "shopping": "200-0000",
        "sights-museums": "300-0000",
        "leisure-outdoor": "550-0000"
    };
    
    Object.entries(categoryMap).forEach(([category, categoryCode]) => {
        // Using correct browse endpoint with categoryId instead of categories text
        const url = `https://browse.search.hereapi.com/v1/browse?route=${corridor}&radius=${radius}&in=circle:${corridor.split(';')[0]}&categoryIds=${categoryCode}&limit=50&apikey=${apikey}`;
        
        console.log(`[DEBUG] POI corridor request URL for ${category}:`, url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    console.error(`[ERROR] HTTP error ${response.status} for ${category}`);
                    return response.text().then(text => {
                        console.error(`[ERROR] Response body: ${text}`);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(`[DEBUG] POI corridor response for ${category}:`, data);
                
                if (data.items && Array.isArray(data.items)) {
                    console.log(`[INFO] Found ${data.items.length} POIs for category ${category}`);
                    const newProcessedPOIs = new Set(processedPOIs);
                    
                    data.items.forEach(poi => {
                        if (!newProcessedPOIs.has(poi.id)) {
                            newProcessedPOIs.add(poi.id);
                            
                            // Extract website information
                            let website = '';
                            if (poi.contacts && poi.contacts.length > 0) {
                                const contact = poi.contacts[0];
                                if (contact.www && contact.www.length > 0) {
                                    website = contact.www[0].value;
                                }
                            }
                            
                            const poiData = {
                                id: poi.id,
                                position: [poi.position.lat, poi.position.lng],
                                title: poi.title,
                                name: poi.title,
                                website: website,
                                isPOI: true, // Mark as POI point
                                category: category
                            };
                            
                            console.log(`[DEBUG] Adding POI: ${poi.title} at ${poi.position.lat},${poi.position.lng}`);
                            
                            // Set current category for icon color
                            setPoiCategory(category);
                            addPOIMarker(poiData);
                        }
                    });
                    
                    setProcessedPOIs(newProcessedPOIs);
                } else {
                    console.warn(`[WARN] No POIs found for category: ${category}`);
                }
            })
            .catch(error => {
                console.error(`[ERROR] POI corridor fetch failed for ${category}:`, error);
            });
    });
};
 
/**
     * Creates marker icons with appropriate styling based on marker type
     * 
     * Process:
     * 1. Determines marker type based on color role
     * 2. Sets appropriate size for the marker type
     * 3. Returns custom marker icon using utility function
     * 
     * Args:
     *   color (String): Color for the marker
     *   size (Number): Base size value (default: 7)
     * 
     * Returns:
     *   Object: HERE Maps icon object for markers
     */
function getMarkerIcon(color, size = 7) {
    // Use the new Material UI styled markers
    let markerType = 'circular';
    let markerSize = 24;
    
    // Choose marker type based on color role
    switch(color) {
        case 'red': // User location
            markerType = 'pin';  // Changed from 'pulse' to 'pin' to match other locations
            markerSize = 32;     // Use standard pin size instead of multiplier
            break;
        case 'green': // Destination
            markerType = 'pin';
            markerSize = 32;
            break;
        case 'blue': // Start/waypoints
            markerType = 'pin';
            markerSize = 28;
            break;
        case 'purple': // Custom points
            markerType = 'star';
            markerSize = 32;
            break;
        default:
            markerType = 'circular';
    }
    
    return getCustomMarkerIcon(H, color, markerType, { size: markerSize });
}

/**
 * Calculates and displays a route between waypoints
 * 
 * Process:
 * 1. Initializes routing service with platform
 * 2. Configures routing parameters with waypoints
 * 3. Calls HERE API to calculate the route
 * 4. Processes response to create route polyline
 * 5. Adds route, waypoints, and user markers to map
 * 6. Initiates POI search along the calculated route
 * 
 * Args:
 *   platform (Object): HERE platform service
 *   map (Object): HERE map instance
 *   waypoints (Array): Array of location points for route
 * 
 * Side effects:
 *   Clears existing objects from the map
 *   Adds route polyline to the map
 *   Adds waypoint markers to the map
 *   Updates map viewport to show the entire route
 *   Initiates POI search along the route
 */
function calculateRoute(platform, map, waypoints) {
    const router = platform.getRoutingService(null, 8);

    // Define route parameters using first waypoint as origin and last as destination
    const routingParams = {
        origin: `${waypoints[0].lat},${waypoints[0].lng}`,
        destination: `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`,
        transportMode: 'pedestrian',
        return: 'polyline'
    };

    // If there are more than 2 waypoints, add the via parameter (excluding first and last)
    if (waypoints.length > 2) {
        routingParams.via = waypoints
            .slice(1, -1) // Exclude the first and last points
            .map(point => `${point.lat},${point.lng}`)
            .join('!');
    }

    console.log('[DEBUG] Calculating route with params:', routingParams);

    // Call routing service
    router.calculateRoute(routingParams, (response) => {
        if (response.routes && response.routes.length > 0) {
            console.log('[DEBUG] Route calculation succeeded');
            const sections = response.routes[0].sections;
            const lineStrings = sections.map(section =>
                H.geo.LineString.fromFlexiblePolyline(section.polyline)
            );
            const multiLineString = new H.geo.MultiLineString(lineStrings);
            const bounds = multiLineString.getBoundingBox();

            // Create a route fold
            const newRoutePolyline = new H.map.Polyline(multiLineString, {
                style: {
                    lineWidth: 5,
                    strokeColor: 'rgba(0, 128, 255, 0.7)'
                }
            });

            // Store the route polyline for POI discovery
            routePolyline.current = newRoutePolyline;

            // Clear all objects on the map
            map.removeObjects(map.getObjects());
            
            // Reset POI markers
            setPoiMarkers([]);
            setProcessedPOIs(new Set());

            // Add route to the map
            map.addObject(newRoutePolyline);

            console.log("Adding waypoint markers for route");
            // Add markers for all waypoints
            const markers = waypoints.map((point, index) => {
                // Start point is blue, end point is green, intermediate points are blue
                const color = index === 0 ? 'blue' : (index === waypoints.length - 1 ? 'green' : 'blue');
                
                try {
                    // Create marker with the appropriate icon
                    const marker = new H.map.Marker(point, {
                        icon: getMarkerIcon(color)
                    });
                    
                    // Add custom data for the point (could be name if available)
                    const pointName = point.name || (index === 0 ? "Starting point" : (index === waypoints.length - 1 ? "End point" : `Waypoint ${index}`));
                    marker.setData({
                        name: pointName,
                        title: pointName,
                        isWaypoint: true,
                        waypointIndex: index
                    });
                    
                    // Add tap event to marker
                    marker.addEventListener('tap', (evt) => {
                        const position = {
                            lat: marker.getGeometry().lat,
                            lng: marker.getGeometry().lng
                        };
                        showMarkerInfoBubble(marker, position);
                    });
                    
                    return marker;
                } catch (e) {
                    console.error("Error creating waypoint marker:", e);
                    return null;
                }
            }).filter(marker => marker !== null);

            // Add all markers to the map
            if (markers.length > 0) {
                map.addObjects(markers);
                console.log("Added waypoint markers:", markers.length);
            }

            console.log("Adding user position marker in route calculation");
            // Add user position marker with a custom icon and label
            try {
                const userMarker = new H.map.Marker(userPosition, {
                    icon: getCustomMarkerIcon(H, 'red', 'pin', { 
                        size: 32, 
                        label: 'My Current Location' 
                    })
                });
                userMarker.setData({
                    name: "My Current Location",
                    title: "My Current Location"
                });
                // Add tap event to user marker
                userMarker.addEventListener('tap', (evt) => {
                    const position = {
                        lat: userMarker.getGeometry().lat,
                        lng: userMarker.getGeometry().lng
                    };
                    showMarkerInfoBubble(userMarker, position);
                });
                map.addObject(userMarker);
                console.log("User marker added in route calculation");
            } catch (e) {
                console.error("Error adding user position marker in route calculation:", e);
            }

            console.log("Adding custom points in route calculation:", customPoints);
            // Add custom points markers
            if (customPoints && Array.isArray(customPoints)) {
                customPoints.forEach(point => {
                    try {
                        if (point && point.location && typeof point.location.lat === 'number' && typeof point.location.lng === 'number') {
                            console.log("Adding custom point in route calculation:", point);
                            const marker = new H.map.Marker(point.location, {
                                icon: getCustomMarkerIcon(H, '#9c27b0', 'pin', { 
                                    size: 32, 
                                    label: point.name || ''
                                })
                            });
                            // Set full point data including name
                            marker.setData(point);
                            // Add tap event to marker
                            marker.addEventListener('tap', (evt) => {
                                const position = {
                                    lat: marker.getGeometry().lat,
                                    lng: marker.getGeometry().lng
                                };
                                showMarkerInfoBubble(marker, position);
                            });
                            map.addObject(marker);
                            console.log("Custom point marker added in route calculation");
                        } else {
                            console.warn("Invalid custom point in route calculation:", point);
                        }
                    } catch (e) {
                        console.error("Error adding custom point in route calculation:", e);
                    }
                });
            }

            // Adjust the map perspective to include all marks and routes
            map.getViewModel().setLookAtData({ bounds });

            // Search for POIs along the route using HERE Search Service API
            // Implementation of POI search with search service...
        } else {
            console.error('No routes found in the response:', response);
        }
    }, (error) => {
        console.error('Error calculating route:', error);
    });
}
 
/**
     * Main effect hook for initializing and updating the map
     * 
     * Process:
     * 1. Initializes HERE platform service with API key
     * 2. Creates map instance if not already created
     * 3. Sets up map event listeners for interactions
     * 4. Adds user position and custom points markers
     * 5. Calculates routes when selected locations change
     * 6. Updates map with current state on re-renders
     * 
     * Dependencies:
     *   apikey, userPosition, selectedLocations, customPoints,
     *   onMapClick, restaurantList, loading
     * 
     * Side effects:
     *   Initializes map instance and UI
     *   Adds markers and routes to the map
     *   Sets up map event handlers
     */
useEffect(() => {
    // Initialize platform if not done yet.
    if (!platform.current) {
        platform.current = new H.service.Platform({ apikey });
    }

    // Wait until loading is complete before initializing or updating the map
    if (loading) {
        return;
    }

    const defaultLayers = platform.current.createDefaultLayers({ pois: true });

    // Initialize map if not already initialized
    if (!map.current) {
        const newMap = new H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
                zoom: 14,
                center: userPosition,
            }
        );

        // Add map click event listener
        newMap.addEventListener('tap', (evt) => {
            const coord = newMap.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
            console.log('Map clicked:', coord.lat, coord.lng);
            if (onMapClick) {
                onMapClick(coord.lat, coord.lng);
            }
        });

        new H.mapevents.Behavior(new H.mapevents.MapEvents(newMap));
        ui.current = H.ui.UI.createDefault(newMap, defaultLayers);
        map.current = newMap;

        // Make sure to add user position marker immediately after map initialization
        if (userPosition) {
            try {
                const userMarker = new H.map.Marker(userPosition, {
                    icon: getCustomMarkerIcon(H, 'red', 'pin', { 
                        size: 32, 
                        label: 'My Current Location' 
                    })
                });
                userMarker.setData({
                    name: "My Current Location",
                    title: "My Current Location"
                });
                // Add tap event to user marker
                userMarker.addEventListener('tap', (evt) => {
                    const position = {
                        lat: userMarker.getGeometry().lat,
                        lng: userMarker.getGeometry().lng
                    };
                    showMarkerInfoBubble(userMarker, position);
                });
                map.current.addObject(userMarker);
                console.log("User marker added during initialization");
            } catch (e) {
                console.error("Error adding user position marker:", e);
            }
        }

        // Add custom points immediately after initialization
        console.log("Adding custom points during initialization", customPoints);
        if (customPoints && Array.isArray(customPoints) && customPoints.length > 0) {
            customPoints.forEach(point => {
                try {
                    if (point && point.location && typeof point.location.lat === 'number' && typeof point.location.lng === 'number') {
                        console.log("Adding custom point during initialization:", point);
                        const marker = new H.map.Marker(point.location, {
                            icon: getCustomMarkerIcon(H, '#9c27b0', 'pin', { 
                                size: 32, 
                                label: point.name || '' 
                            })
                        });
                        // Set full point data including name
                        marker.setData(point);
                        // Add tap event to marker
                        marker.addEventListener('tap', (evt) => {
                            const position = {
                                lat: marker.getGeometry().lat,
                                lng: marker.getGeometry().lng
                            };
                            showMarkerInfoBubble(marker, position);
                        });
                        map.current.addObject(marker);
                        console.log("Custom point marker added during initialization");
                    } else {
                        console.warn("Invalid point or location during initialization:", point);
                    }
                } catch (e) {
                    console.error("Error adding custom point during initialization:", e);
                }
            });
        }
    } else {
        // Map already exists, update its state
        
        // Save current POI markers for later re-addition
        const currentPOIMarkers = [...poiMarkers];
        
        // Clear all existing POI markers from the map and state
        clearPOIs();
        
        // Only update center when necessary, not on every re-render
        if (map.current.getCenter().lat !== userPosition.lat || 
            map.current.getCenter().lng !== userPosition.lng) {
            // Update map center position
            map.current.setCenter(userPosition);
        }
        
        // Only remove non-POI objects (keep POI markers until route changes)
        const nonPOIObjects = map.current.getObjects().filter(obj => 
            !poiMarkers.includes(obj) && 
            !(obj === routePolyline.current)
        );
        map.current.removeObjects(nonPOIObjects);
        
        console.log("Adding user position marker");
        // Add user position marker with a custom icon and label
        if (userPosition) {
            try {
                const userMarker = new H.map.Marker(userPosition, {
                    icon: getCustomMarkerIcon(H, 'red', 'pin', { 
                        size: 32, 
                        label: 'My Current Location' 
                    })
                });
                userMarker.setData({
                    name: "My Current Location",
                    title: "My Current Location"
                });
                // Add tap event to user marker
                userMarker.addEventListener('tap', (evt) => {
                    const position = {
                        lat: userMarker.getGeometry().lat,
                        lng: userMarker.getGeometry().lng
                    };
                    showMarkerInfoBubble(userMarker, position);
                    
                    // Prevent automatic map center reset
                    evt.stopPropagation();
                });
                map.current.addObject(userMarker);
                console.log("User marker added");
                
            } catch (e) {
                console.error("Error adding user position marker:", e);
            }
        }
        
        console.log("Adding custom points", customPoints);
        // Add custom points markers
        if (customPoints && Array.isArray(customPoints) && customPoints.length > 0) {
            customPoints.forEach(point => {
                try {
                    if (point && point.location && typeof point.location.lat === 'number' && typeof point.location.lng === 'number') {
                        console.log("Adding custom point:", point);
                        const marker = new H.map.Marker(point.location, {
                            icon: getCustomMarkerIcon(H, '#9c27b0', 'pin', { 
                                size: 32, 
                                label: point.name || '' 
                            })
                        });
                        // Set full point data including name
                        marker.setData(point);
                        // Add tap event to marker
                        marker.addEventListener('tap', (evt) => {
                            const position = {
                                lat: marker.getGeometry().lat,
                                lng: marker.getGeometry().lng
                            };
                            showMarkerInfoBubble(marker, position);
                        });
                        map.current.addObject(marker);
                        console.log("Custom point marker added");
                    } else {
                        console.warn("Invalid point or location:", point);
                    }
                } catch (e) {
                    console.error("Error adding custom point:", e);
                }
            });
        }
    }

    // Calculate route only if there are 2 or more selected locations
    if (selectedLocations && Array.isArray(selectedLocations) && selectedLocations.length >= 2) {
        calculateRoute(
            platform.current,
            map.current,
            selectedLocations
        );
    }
    // If only one location is selected, just show the marker
    else if (selectedLocations && Array.isArray(selectedLocations) && selectedLocations.length === 1) {
        const marker = new H.map.Marker(selectedLocations[0], {
            icon: getMarkerIcon('green')
        });
        
        // Set marker data with location name if available
        const locationName = selectedLocations[0].name || "Selected Location";
        marker.setData({
            name: locationName,
            title: locationName
        });
        
        // Add tap event to marker
        marker.addEventListener('tap', (evt) => {
            const position = {
                lat: marker.getGeometry().lat,
                lng: marker.getGeometry().lng
            };
            showMarkerInfoBubble(marker, position);
        });
        
        map.current?.addObject(marker);
    }

    // Clean up function to remove POI controls when component unmounts
    return () => {
        // const controlPanel = document.querySelector('.poi-control-panel');
        // if (controlPanel) {
        //     controlPanel.remove();
        // }
    };
}, [apikey, userPosition, selectedLocations, customPoints, onMapClick, restaurantList, loading]);

/**
 * Render the map component
 * 
 * Process:
 * 1. Creates a container div for the map
 * 2. Displays loading overlay when in loading state
 * 
 * Returns:
 *   Map container with optional loading indicator
 */
return (
    <div className="map-container" ref={mapRef}>
        {loading && (
            <div className="loading-overlay">
                <div className="loading-spinner">
                    <CircularProgress color="primary" />
                    <Typography className="loading-text">Getting your location...</Typography>
                </div>
            </div>
        )}
    </div>
);
});

export default Map;