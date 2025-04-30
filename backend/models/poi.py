"""
Points of Interest (POI) model for handling POIs near cycling routes
"""
import os
import requests
import json
from datetime import datetime, timedelta

# This variable will be set in app.py
db = None

class POI:
    """
    Class for managing POIs from HERE Places API
    """
    @staticmethod
    def get_pois_near_route(route_coordinates, categories, radius=500):
        """
        Get POIs near a cycling route
        
        Args:
            route_coordinates: List of coordinate points along the route
            categories: List of POI categories to search for
            radius: Search radius in meters
        
        Returns:
            List of POI objects
        """
        # Sample coordinates along the route at intervals to avoid too many API calls
        sampled_coordinates = POI.sample_route_points(route_coordinates, max_points=5)
        
        # Get HERE API key from environment variables
        api_key = os.environ.get('HERE_API_KEY')
        if not api_key:
            print("Warning: HERE API key not found in environment variables")
            return []
        
        all_pois = []
        # Query HERE Places API for each search point
        for coord in sampled_coordinates:
            lat, lng = coord['lat'], coord['lng']
            
            # Create cache key for this query
            cache_key = f"poi_{lat}_{lng}_{radius}_{'-'.join(categories)}"
            
            # Check cache first
            cached_pois = POI.get_cached_pois(cache_key)
            if cached_pois:
                all_pois.extend(cached_pois)
                continue
            
            # Make request to HERE Places API
            url = "https://places.ls.hereapi.com/places/v1/browse"
            params = {
                'apiKey': api_key,
                'at': f"{lat},{lng}",
                'radius': radius,
                'cat': ','.join(categories) if categories else '',
                'size': 100  # Max results per request
            }
            
            try:
                response = requests.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('results', {}).get('items', [])
                    
                    # Cache the results
                    POI.cache_pois(cache_key, items)
                    
                    all_pois.extend(items)
            except Exception as e:
                print(f"Error querying HERE Places API: {e}")
        
        # Remove duplicates based on place ID
        unique_pois = POI.remove_duplicate_pois(all_pois)
        
        return unique_pois
    
    @staticmethod
    def sample_route_points(route_coordinates, max_points=5):
        """
        Sample a reasonable number of points along the route
        
        Args:
            route_coordinates: List of coordinates along the route
            max_points: Maximum number of points to sample
        
        Returns:
            List of sampled coordinates
        """
        if not route_coordinates or len(route_coordinates) <= 2:
            return route_coordinates
        
        # If there are only a few points, return them all
        if len(route_coordinates) <= max_points:
            return route_coordinates
        
        # Otherwise, sample points at regular intervals
        sampled = [route_coordinates[0]]  # Always include start point
        
        # Calculate step size to get approximately max_points
        step = len(route_coordinates) // (max_points - 2)
        
        # Sample intermediate points
        for i in range(step, len(route_coordinates) - 1, step):
            sampled.append(route_coordinates[i])
        
        # Always include end point
        sampled.append(route_coordinates[-1])
        
        return sampled
    
    @staticmethod
    def remove_duplicate_pois(pois):
        """
        Remove duplicate POIs based on place ID
        
        Args:
            pois: List of POI objects
        
        Returns:
            List of unique POI objects
        """
        unique_pois = {}
        for poi in pois:
            poi_id = poi.get('id')
            if poi_id and poi_id not in unique_pois:
                unique_pois[poi_id] = poi
        
        return list(unique_pois.values())
    
    @staticmethod
    def get_cached_pois(cache_key):
        """
        Get POIs from cache
        
        Args:
            cache_key: Cache key for this query
        
        Returns:
            List of POI objects if found in cache, otherwise None
        """
        global db
        if db is None:
            return None
        
        cache_entry = db.poi_cache.find_one({'cache_key': cache_key})
        if cache_entry and cache_entry.get('expiry') > datetime.now():
            return cache_entry.get('pois', [])
        
        return None
    
    @staticmethod
    def cache_pois(cache_key, pois, expiry_hours=24):
        """
        Cache POIs for future use
        
        Args:
            cache_key: Cache key for this query
            pois: List of POI objects
            expiry_hours: Number of hours until cache entry expires
        """
        global db
        if db is None:
            return
        
        # Set expiry time
        expiry = datetime.now() + timedelta(hours=expiry_hours)
        
        # Store in cache
        db.poi_cache.update_one(
            {'cache_key': cache_key},
            {'$set': {
                'pois': pois,
                'expiry': expiry
            }},
            upsert=True
        )
    
    @staticmethod
    def get_poi_categories():
        """
        Get available POI categories from HERE Places API
        
        Returns:
            Dictionary of category groups with their subcategories
        """
        # These are common categories that users might be interested in
        # This is a simplified set, as the HERE API has many categories
        categories = {
            "eat-drink": {
                "label": "Food & Drink",
                "subcategories": {
                    "restaurant": "Restaurants",
                    "coffee-tea": "Coffee & Tea",
                    "snacks-fast-food": "Fast Food",
                    "bar-pub": "Bars & Pubs"
                }
            },
            "leisure-outdoor": {
                "label": "Leisure & Outdoor",
                "subcategories": {
                    "park": "Parks",
                    "recreation": "Recreation",
                    "museum": "Museums",
                    "tourist-attraction": "Tourist Attractions",
                    "natural-geographical": "Natural Features"
                }
            },
            "service": {
                "label": "Services",
                "subcategories": {
                    "toilet-rest-area": "Restrooms",
                    "hospital-health-care-facility": "Hospitals",
                    "petrol-station": "Gas Stations",
                    "atm-bank-exchange": "ATMs & Banks"
                }
            },
            "facilities": {
                "label": "Facilities",
                "subcategories": {
                    "accommodation": "Accommodations",
                    "shopping": "Shopping"
                }
            }
        }
        
        return categories