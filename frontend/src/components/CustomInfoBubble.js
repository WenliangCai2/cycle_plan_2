import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Typography, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Compact bubble style
const CompactBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  minWidth: '60px',
  maxWidth: '150px',
  boxShadow: theme.shadows[2],
  borderRadius: '12px',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    marginLeft: '-8px',
    border: '8px solid transparent',
    borderTopColor: theme.palette.background.paper
  }
}));

/**
 * Creates compact info bubble content
 * @param {Object} data - Data to show in the bubble
 * @returns {HTMLElement} DOM element with styled bubble
 */
export const createInfoBubbleContent = (data) => {
  // Extract name (prioritize title)
  const name = data.title || data.name || 'Unnamed Location';
  
  // Create React render container
  const container = document.createElement('div');
  
  // Define React component
  const InfoBubbleContent = () => (
    <CompactBubble>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {name}
        </Typography>
      </Box>
    </CompactBubble>
  );
  
  // Use modern React DOM API
  const root = ReactDOM.createRoot(container);
  root.render(<InfoBubbleContent />);
  
  return container;
};

export default {
  createInfoBubbleContent
}; 