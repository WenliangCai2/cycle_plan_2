import React, { useEffect, useRef, useState } from 'react';
import H from '@here/maps-api-for-javascript';
import { getCustomMarkerIcon } from './components/CustomMapMarker';
import { createInfoBubbleContent } from './components/CustomInfoBubble';
import './components/MapStyles.css';
import { CircularProgress, Typography } from '@mui/material';
 
const Map = (props) => {
    const mapRef = useRef(null);
    const map = useRef(null);
    const platform = useRef(null);
    const routePolyline = useRef(null);
    const ui = useRef(null);
    const [poiMarkers, setPoiMarkers] = useState([]);
    const [poiRadius, setPoiRadius] = useState(500);
    const [poiCategory, setPoiCategory] = useState('restaurants');
    const [processedPOIs, setProcessedPOIs] = useState(new Set());

    const { apikey, userPosition, selectedLocations, onMapClick, customPoints, restaurantList, loading } = props;
 
    // POI categories mapping
    const poiCategories = {
        "restaurants": "100-1000",
        "coffee-tea": "100-1100",
        "shopping": "200-0000",
        "sights-museums": "300-0000",
        "accommodation": "500-0000",
        "leisure-outdoor": "550-0000",
        "transport": "400-0000"
    };
 
    // Create POI control panel
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
                    <input type="range" id="poi-radius" min="100" max="2000" step="100" value="${poiRadius}">
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
 
    // Clear existing POI markers
    const clearPOIs = () => {
        if (map.current && poiMarkers.length > 0) {
            poiMarkers.forEach(marker => map.current.removeObject(marker));
            setPoiMarkers([]);
            setProcessedPOIs(new Set());
        }
    };
 
    // Get color for POI category
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
 
    // Create a custom icon for POI based on category
    const createPOIIcon = (category) => {
        const iconColor = getCategoryColor(category);
        return getCustomMarkerIcon(H, iconColor, 'star', { size: 24 });
    };
 
    // Show info bubble for any marker when clicked
    const showMarkerInfoBubble = (marker, position) => {
        try {
            console.log("Showing info bubble for marker");
            // Get marker data
            const markerData = marker.getData();
            console.log("Marker data:", markerData);
            
            // Extract only the name, simplify data processing
            let title = '';
            
            if (typeof markerData === 'string') {
                // Simple string data
                title = markerData;
            } else if (markerData && typeof markerData === 'object') {
                // Object data - extract name/title
                title = markerData.name || markerData.title || 'Unnamed Location';
            } else {
                // Default value
                title = 'Location Point';
            }
            
            // Prepare only the name data
            const bubbleData = { title: title };
            
            console.log("Creating simple info bubble with title:", title);
            
            // Create and show the bubble
            const bubbleContent = createInfoBubbleContent(bubbleData);
            
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
            console.log("Simple info bubble added");
            
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
 
    // Add a marker for a POI on the map
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
 
    // Search for POIs near a specific location
    const searchPOIsNearby = (lat, lng, radius, category) => {
        const query = encodeURIComponent(category);
        const url = `https://discover.search.hereapi.com/v1/discover?at=${lat},${lng}&q=${query}&limit=10&apikey=${apikey}`;

        console.log('[DEBUG] POI request URL:', url);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('[DEBUG] POI response:', data);

                if (data.items && Array.isArray(data.items)) {
                    const newProcessedPOIs = new Set(processedPOIs);

                    data.items.forEach(poi => {
                        if (!newProcessedPOIs.has(poi.id)) {
                            newProcessedPOIs.add(poi.id);

                            const poiData = {
                                id: poi.id,
                                position: [poi.position.lat, poi.position.lng],
                                title: poi.title,
                                name: poi.title,
                            };

                            addPOIMarker(poiData);
                        }
                    });

                    setProcessedPOIs(newProcessedPOIs);
                } else {
                    console.warn('[WARN] No POIs found for query:', query);
                }
            })
            .catch(error => {
                console.error('[ERROR] POI fetch failed:', error);
            });
    };

    // Find POIs along the route within the specified radius
    const findPOIsAlongRoute = () => {
        clearPOIs();
       
        if (!routePolyline.current || !map.current) {
            console.warn('No route available to search for POIs');
            return;
        }
       
        // Get route geometry for sampling points
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
       
        // Sample points along the route for POI search
        // Take points at regular intervals to avoid too many API calls
        const sampleStep = Math.max(1, Math.floor(routePoints.getPointCount() / 10));
        const searchPoints = [];
       
        for (let i = 0; i < routePoints.getPointCount(); i += sampleStep) {
            searchPoints.push(routePoints.get(i));
        }
       
        // Ensure the last point is included
        if (searchPoints[searchPoints.length - 1] !== routePoints.get(routePoints.getPointCount() - 1)) {
            searchPoints.push(routePoints.get(routePoints.getPointCount() - 1));
        }
       
        // Search for POIs around each sampled point
        searchPoints.forEach(point => {
            searchPOIsNearby(point.lat, point.lng, poiRadius, poiCategory);
        });
    };
 
    // Get tag icon (from original implementation)
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
 
    // Modified route calculation (from original implementation, with POI support added)
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
 
        // Call routing service
        router.calculateRoute(routingParams, (response) => {
            if (response.routes && response.routes.length > 0) {
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
 
                // Add route folds
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
 
                // Find POIs along the route
                findPOIsAlongRoute();
            } else {
                console.error('No routes found in the response:', response);
            }
        }, (error) => {
            console.error('Error calculating route:', error);
        });
    }
 
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
 
            // Create the POI control panel after map initialization
            setTimeout(() => {
                createPOIControlPanel();
            }, 500);
        } else {
            // If map exists but user position changed, update the center
            map.current.setCenter(userPosition);
        }
 
        // Clear all objects on the map
        if (map.current) {
            map.current.removeObjects(map.current.getObjects());
            
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
            const controlPanel = document.querySelector('.poi-control-panel');
            if (controlPanel) {
                controlPanel.remove();
            }
        };
    }, [apikey, userPosition, selectedLocations, customPoints, onMapClick, restaurantList, loading]);
 
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
};
 
export default Map;