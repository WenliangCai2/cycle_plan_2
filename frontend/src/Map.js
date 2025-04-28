import React, { useEffect, useRef } from 'react';
import H from '@here/maps-api-for-javascript';

const Map = (props) => {
    const mapRef = useRef(null);
    const map = useRef(null);
    const platform = useRef(null);
    const { apikey, userPosition, selectedLocations, onMapClick, customPoints, restaurantList, loading } = props;

    useEffect(() => {
        // Initialize platform if not done yet
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
            H.ui.UI.createDefault(newMap, defaultLayers);
            map.current = newMap;
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

// Get tag icon
function getMarkerIcon(color, size = 7) {
    const svgCircle = `<svg width="20" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <g id="marker">
                <circle cx="10" cy="10" r="${size}" fill="${color}" stroke="${color}" stroke-width="4" />
                </g></svg>`;
    return new H.map.Icon(svgCircle, {
        anchor: { x: 10, y: 10 }
    });
}

// Modified route calculation
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
            const routePolyline = new H.map.Polyline(multiLineString, {
                style: {
                    lineWidth: 5,
                    strokeColor: 'rgba(0, 128, 255, 0.7)'
                }
            });

            // Clear all objects on the map
            map.removeObjects(map.getObjects());

            // Add route folds
            map.addObject(routePolyline);

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

            // Adjust the map perspective to include all marks and routes
            map.getViewModel().setLookAtData({ bounds });
        } else {
            console.error('No routes found in the response:', response);
        }
    }, (error) => {
        console.error('Error calculating route:', error);
    });
}

export default Map;