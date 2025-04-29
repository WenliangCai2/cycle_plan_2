import React, { useEffect, useRef, useState } from 'react';
import H from '@here/maps-api-for-javascript';
 
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
       
        const svgMarkup = `<svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.383 0 0 5.383 0 12c0 9.164 12 20 12 20s12-10.836 12-20c0-6.617-5.383-12-12-12z"
                fill="${iconColor}" />
            <circle cx="12" cy="12" r="5" fill="white" />
        </svg>`;
       
        return new H.map.Icon(svgMarkup);
    };
 
    // Show info bubble when POI is clicked
    const showPOIInfoBubble = (poiData, position) => {
        // Create content for the info bubble
        const bubbleContent = document.createElement('div');
        bubbleContent.className = 'poi-info-bubble';
       
        // Format rating stars
        const rating = poiData.averageRating || 0;
        const stars = "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
       
        bubbleContent.innerHTML = `
            <h3>${poiData.title}</h3>
            <p>${poiData.vicinity || 'No address available'}</p>
            <p>Rating: ${stars} (${rating.toFixed(1)})</p>
            <p>${poiData.category ? poiData.category.title : 'No category'}</p>
            ${poiData.contacts && poiData.contacts.phone ?
                `<p>Phone: ${poiData.contacts.phone[0].value}</p>` : ''}
            ${poiData.openingHours ?
                `<p>${poiData.openingHours.isOpen ? 'Open Now' : 'Closed'}</p>` : ''}
            ${poiData.href ?
                `<a href="${poiData.href}" target="_blank">More Information</a>` : ''}
        `;
       
        // Create and show the info bubble
        const infoBubble = new H.ui.InfoBubble(position, {
            content: bubbleContent
        });
       
        // Add the info bubble to the UI
        ui.current.addBubble(infoBubble);
    };
 
    // Add a marker for a POI on the map
    const addPOIMarker = (poi) => {
        if (!map.current) return;
       
        const poiPosition = {
            lat: poi.position[0],
            lng: poi.position[1]
        };
       
        // Create marker
        const poiMarker = new H.map.Marker(poiPosition, {
            icon: createPOIIcon(poiCategory)
        });
       
        // Add data to the marker
        poiMarker.setData(poi);
       
        // Add tap/click event to show the POI info
        poiMarker.addEventListener('tap', event => {
            const poiData = event.target.getData();
            showPOIInfoBubble(poiData, poiPosition);
        });
       
        // Add to map and to our markers array
        map.current.addObject(poiMarker);
        setPoiMarkers(prevMarkers => [...prevMarkers, poiMarker]);
    };
 
    // Search for POIs near a specific location
    const searchPOIsNearby = (lat, lng, radius, category) => {
        // Create a search request using the HERE Places API
        const params = {
            at: `${lat},${lng}`,
            limit: 20,
            radius: radius,
            categories: poiCategories[category]
        };
       
        // Convert params object to URL parameters
        const urlParams = new URLSearchParams(params);
       
        // Make the API request to HERE Places API
        fetch(`https://places.ls.hereapi.com/places/v1/browse?apiKey=${apikey}&${urlParams}`)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const newProcessedPOIs = new Set(processedPOIs);
                   
                    data.items.forEach(poi => {
                        // Skip if this POI has already been processed
                        if (newProcessedPOIs.has(poi.id)) {
                            return;
                        }
                       
                        // Add to processed set
                        newProcessedPOIs.add(poi.id);
                       
                        // Add marker for this POI
                        addPOIMarker(poi);
                    });
                   
                    setProcessedPOIs(newProcessedPOIs);
                }
            })
            .catch(error => {
                console.error('Error fetching POIs:', error);
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
        const svgCircle = `<svg width="20" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <g id="marker">
                    <circle cx="10" cy="10" r="${size}" fill="${color}" stroke="${color}" stroke-width="4" />
                    </g></svg>`;
        return new H.map.Icon(svgCircle, {
            anchor: { x: 10, y: 10 }
        });
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
 
                // Add markers for all waypoints
                const markers = waypoints.map((point, index) => {
                    // Start point is blue, end point is green, intermediate points are blue
                    const color = index === 0 ? 'blue' : (index === waypoints.length - 1 ? 'green' : 'blue');
                    const marker = new H.map.Marker(point, {
                        icon: getMarkerIcon(color)
                    });
                   
                    // Add custom data for the point (could be name if available)
                    marker.setData(index === 0 ? "Start" : (index === waypoints.length - 1 ? "End" : `Stop ${index}`));
                   
                    return marker;
                });
 
                // Add all markers to the map
                map.addObjects(markers);
 
                // Add user position marker with a custom icon and label
                const userMarker = new H.map.Marker(userPosition, {
                    icon: getMarkerIcon('red', 10) // Larger user location marker
                });
                userMarker.setData("Your Location");
                map.addObject(userMarker);
 
                // Add custom points markers
                if (customPoints && Array.isArray(customPoints)) {
                    customPoints.forEach(point => {
                        const marker = new H.map.Marker(point.location, {
                            icon: getMarkerIcon('purple') // Custom points
                        });
                        marker.setData(point.name || "Custom Point");
                        map.addObject(marker);
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
        map.current?.removeObjects(map.current.getObjects());
 
        // Add user position marker with a custom icon and label
        const userMarker = new H.map.Marker(userPosition, {
            icon: getMarkerIcon('red', 10) // Larger user location marker
        });
        userMarker.setData("Your Location");
        map.current?.addObject(userMarker);
 
        // Add custom points markers
        if (customPoints && Array.isArray(customPoints)) {
            customPoints.forEach(point => {
                const marker = new H.map.Marker(point.location, {
                    icon: getMarkerIcon('purple') // Custom points
                });
                marker.setData(point.name || "Custom Point");
                map.current?.addObject(marker);
            });
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
        <div style={{ width: '100%', height: '500px', position: 'relative' }} ref={mapRef}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div>Getting your location...</div>
                </div>
            )}
        </div>
    );
};
 
export default Map;