import React from 'react';
import { styled } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import RoomIcon from '@mui/icons-material/Room';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import PinDropIcon from '@mui/icons-material/PinDrop';
import { SvgIcon, Box, Badge, Avatar, Tooltip } from '@mui/material';

/**
 * Creates SVG markup for different marker styles using Material UI designs
 * @param {string} color - The color for the marker
 * @param {string} type - The type of marker to create (pin, dot, etc.)
 * @param {number} size - The size of the marker
 * @returns {string} SVG markup for the marker
 */
export const createMarkerIcon = (color = '#3f51b5', type = 'pin', size = 32, label = '') => {
  // Mapping of marker types to SVG path data
  const markerTypes = {
    pin: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
            <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>`,
    
    circular: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="${color}" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>`,
    
    pulse: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.7" />
              <circle cx="12" cy="12" r="6" fill="${color}" opacity="0.5" />
              <circle cx="12" cy="12" r="4" fill="${color}" />
            </svg>`,
    
    flag: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
            <path fill="${color}" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
           </svg>`,
    
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
            <path fill="${color}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
           </svg>`,
  };

  // Add label if provided
  let svgWithLabel = markerTypes[type] || markerTypes.pin;
  
  if (label) {
    // Insert label text into the SVG
    svgWithLabel = svgWithLabel.replace('</svg>', 
      `<text x="12" y="30" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#000">${label}</text></svg>`);
  }

  return svgWithLabel;
};

/**
 * Creates material icon for H.HERE maps
 * @param {Object} H - H.HERE maps API object
 * @param {Object} options - Options for the marker
 * @returns {Object} H.map.Icon instance
 */
export const createMaterialIcon = (H, options = {}) => {
  const {
    color = '#3f51b5',
    type = 'pin',
    size = 32,
    label = '',
    anchor = { x: 12, y: 24 } // Default anchor for pin type
  } = options;

  const svgMarkup = createMarkerIcon(color, type, size, label);
  
  return new H.map.Icon(svgMarkup, { anchor });
};

/**
 * Creates a custom styled marker
 * @param {string} color - The color for the marker
 * @param {string} type - The type of marker (pin, circular, etc.)
 * @param {Object} props - Additional properties
 * @returns {Object} An object containing the H.map.Icon and styling info
 */
export const getCustomMarkerIcon = (H, color = '#3f51b5', type = 'pin', props = {}) => {
  const { 
    size = 32, 
    label = '', 
    pulse = false, 
    zIndex = 1
  } = props;
  
  // Different anchor points based on marker type
  const anchorPoints = {
    pin: { x: size/2, y: size },
    circular: { x: size/2, y: size/2 },
    pulse: { x: size/2, y: size/2 },
    flag: { x: 5, y: size },
    star: { x: size/2, y: size/2 },
  };
  
  return createMaterialIcon(H, {
    color,
    type,
    size,
    label,
    anchor: anchorPoints[type] || anchorPoints.pin,
  });
};

export default {
  createMarkerIcon,
  createMaterialIcon,
  getCustomMarkerIcon
}; 