import React from 'react';

// Restaurant physical components
function RestaurantEntity(props) {
    const { data, isSelected, onClickHandler, onDeleteHandler } = props;
    const isCurrentLocation = data.isCurrentLocation === true;
    const isCustomPoint = data.isCustom === true;

    // Processing click event
    const handleClick = () => {
        onClickHandler(data.location);
    };

    // Handle delete button click
    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent click event propagation
        console.log("Delete button clicked for:", data);
        
        if (!data.point_id) {
            console.error("Missing point_id for deletion. Data:", data);
            alert("Cannot delete this point: Missing point ID");
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete the point "${data.name}"?`)) {
            try {
                // Get token for authentication
                const token = localStorage.getItem('token');
                
                // Use direct fetch API
                const response = await fetch(
                    `http://localhost:5000/api/custom-points/${data.point_id}`, 
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': token || '',
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.ok) {
                    const responseData = await response.json();
                    if (responseData.success) {
                        // We need to tell parent component to update its state
                        // This is a hack - ideally we would use the onDeleteHandler
                        window.location.reload();
                    } else {
                        alert(`Delete failed: ${responseData.message}`);
                    }
                } else {
                    alert(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.error("Error in direct delete:", error);
                alert(`Delete error: ${error.message}`);
            }
        }
    };

    // Style of restaurant entry
    const entryStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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

    const deleteButtonStyle = {
        padding: '2px 6px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        marginLeft: '8px',
        zIndex: 10
    };

    // Debug information
    if (isCustomPoint) {
        console.log(`Custom point '${data.name}': has point_id=${data.point_id ? 'YES' : 'NO'}`);
    }

    // Show delete button only if isCustom is true and point_id exists
    const showDeleteButton = isCustomPoint && !isCurrentLocation && data.point_id;

    return (
        <div style={entryStyle} onClick={handleClick}>
            <div>
                {data.name} {isSelected && '✓'} {/* A checkmark is displayed when selected */}
                {isCurrentLocation && ' 📍'} {/* Location pin for current location */}
                {isCustomPoint && ' 🖊️'} {/* Custom point indicator */}
                {isCustomPoint && data.point_id && <small style={{fontSize: '9px', color: '#888', display: 'block'}}>{data.point_id.substring(0, 8)}...</small>}
            </div>
            {showDeleteButton && (
                <button 
                    style={deleteButtonStyle} 
                    onClick={handleDelete}
                    title="Delete this custom point"
                >
                    Delete
                </button>
            )}
        </div>
    );
}

function RestaurantList(props) {
    const { list, selectedLocations, onClickHandler, onDeleteHandler } = props;

    console.log("Restaurant list received point list:", list);
    
    // Check if delete handler exists
    if (!onDeleteHandler) {
        console.warn("RestaurantList: No delete handler provided");
    }

    // Sort the list to put current location at the top
    const sortedList = [...list].sort((a, b) => {
        if (a.isCurrentLocation) return -1;
        if (b.isCurrentLocation) return 1;
        return 0;
    });

    // Debug: Check custom points for point_id
    const customPointCount = sortedList.filter(item => item.isCustom).length;
    console.log(`Found ${customPointCount} custom points in list`);
    
    sortedList.forEach(item => {
        if (item.isCustom) {
            console.log(`Custom point in list: name=${item.name}, point_id=${item.point_id || 'NOT SET'}`);
        }
    });

    const restaurantEntries = sortedList.map((entry) => {
        const isSelected = selectedLocations.some(
            (location) =>
                location.lat === entry.location.lat &&
                location.lng === entry.location.lng
        );

        return (
            <RestaurantEntity
                key={entry.name + (entry.point_id || '')} // Use a more unique key
                data={entry}
                isSelected={isSelected}
                onClickHandler={onClickHandler}
                onDeleteHandler={onDeleteHandler}
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