import React from 'react';

// Restaurant physical components
function RestaurantEntity(props) {
    const { data, isSelected, onClickHandler } = props;
    const isCurrentLocation = data.isCurrentLocation === true;

    // Processing click event
    const handleClick = () => {
        onClickHandler(data.location);
    };

    // Style of restaurant entry
    const entryStyle = {
        display: "inline-block",
        padding: "10px",
        margin: "5px",
        border: isCurrentLocation ? "2px solid #ff4d4f" : "1px solid #ddd",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: isSelected 
            ? (isCurrentLocation ? '#ffcccb' : '#e3f2fd') 
            : (isCurrentLocation ? '#fff1f0' : 'white'), // Special colors for current location
        transition: 'background-color 0.3s ease', // Add transition effect
        fontWeight: isCurrentLocation ? 'bold' : 'normal',
    };

    return (
        <div style={entryStyle} onClick={handleClick}>
            {data.name} {isSelected && '✓'} {/* A checkmark is displayed when selected */}
            {isCurrentLocation && ' 📍'} {/* Location pin for current location */}
        </div>
    );
}

function RestaurantList(props) {
    const { list, selectedLocations, onClickHandler } = props;

    // Sort the list to put current location at the top
    const sortedList = [...list].sort((a, b) => {
        if (a.isCurrentLocation) return -1;
        if (b.isCurrentLocation) return 1;
        return 0;
    });

    const restaurantEntries = sortedList.map((entry) => {
        const isSelected = selectedLocations.some(
            (location) =>
                location.lat === entry.location.lat &&
                location.lng === entry.location.lng
        );

        return (
            <RestaurantEntity
                key={entry.name} // Use the restaurant name as a unique key
                data={entry}
                isSelected={isSelected}
                onClickHandler={onClickHandler}
            />
        );
    });

    // Restaurant list container style
    const listStyle = {
        display: 'grid',
        gap: '8px', // Spacing between entries
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    };

    // Check if list is empty
    if (list.length === 0) {
        return (
            <div id="restaurant-list" style={listStyle}>
                <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                    No locations available. Click on the map to add custom points.
                </div>
            </div>
        );
    }

    return (
        <div id="restaurant-list" style={listStyle}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                Available Locations
            </div>
            {restaurantEntries}
        </div>
    );
}

export default RestaurantList;