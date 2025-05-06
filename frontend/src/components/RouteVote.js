/**
 * Route Vote Component
 * =======================
 * This module provides a voting system for routes with upvote and downvote
 * functionality, including optimistic UI updates and server synchronization.
 * 
 * Features:
 * - Upvote and downvote functionality
 * - Vote count display with visual feedback
 * - Optimistic UI updates for improved user experience
 * - Server synchronization with error handling
 * - Authentication state handling with login redirection
 * - Loading states with visual indicators
 * - Notification system for vote actions
 * - Mobile-responsive design
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { createOrUpdateVote, getRouteVotes } from '../api/voteApi';
import { useNavigate } from 'react-router-dom';

// Material UI imports
import { 
  Button, 
  Box,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';

import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined
} from '@mui/icons-material';

/**
 * RouteVote component for upvoting and downvoting routes
 * 
 * Process:
 * 1. Fetches current vote statistics for the route
 * 2. Provides upvote and downvote buttons with counts
 * 3. Handles vote actions with optimistic UI updates
 * 4. Synchronizes with server and handles errors
 * 5. Shows notifications for vote actions
 * 
 * Args:
 *   routeId (String/Number): ID of the route to vote on
 *   isAuthenticated (Boolean): Whether the user is authenticated
 *   onVoteChange (Function): Optional callback when vote changes
 * 
 * Returns:
 *   Vote interface with upvote/downvote buttons and counts
 */
const RouteVote = ({ routeId, isAuthenticated, onVoteChange }) => {
  // State for vote statistics
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(null); // null = not voted, 1 = upvote, -1 = downvote
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Navigation hook for redirects
  const navigate = useNavigate();

  /**
   * Fetch current vote statistics on component mount
   * 
   * Process:
   * 1. Runs once when component mounts or routeId changes
   * 2. Calls fetchVotes function to get data
   */
  useEffect(() => {
    fetchVotes();
  }, [routeId]);

  /**
   * Fetch vote statistics from server
   * 
   * Process:
   * 1. Calls API to get vote data for the route
   * 2. Updates state with received data
   * 3. Handles errors with appropriate logging
   */
  const fetchVotes = async () => {
    try {
      const response = await getRouteVotes(routeId);
      console.log('Fetched vote data:', response);
      
      if (response.success) {
        // Update vote statistics state
        setUpvotes(response.upvotes || 0);
        setDownvotes(response.downvotes || 0);
        setVoteScore(response.vote_score || 0);
        setUserVote(response.user_vote);
        
        console.log('Updated state:', {
          upvotes: response.upvotes || 0,
          downvotes: response.downvotes || 0,
          voteScore: response.vote_score || 0,
          userVote: response.user_vote
        });
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
  };

  /**
   * Close notification snackbar
   * 
   * Process:
   * 1. Updates snackbar state to close it
   */
  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  /**
   * Show notification message
   * 
   * Process:
   * 1. Sets snackbar state with message and severity
   * 
   * Args:
   *   message (String): Message to display
   *   severity (String): Message type (success, error, warning, info)
   */
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  /**
   * Handle vote action with optimistic UI updates
   * 
   * Process:
   * 1. Checks authentication status
   * 2. Updates UI immediately for better UX
   * 3. Sends request to server
   * 4. Synchronizes with server response
   * 5. Handles errors with UI rollback
   * 
   * Args:
   *   voteType (Number): 1 for upvote, -1 for downvote
   */
  const handleVoteWithOptimisticUI = async (voteType) => {
    // Check authentication
    if (!isAuthenticated) {
      showMessage('Please login to vote', 'warning');
      navigate('/login');
      return;
    }

    // Save current state for rollback if needed
    const previousState = {
      upvotes,
      downvotes,
      voteScore,
      userVote
    };
    
    // Calculate new vote statistics based on action
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    let newVoteScore = voteScore;
    let newUserVote = voteType;
    
    // If clicking same vote type as current, cancel vote
    if (userVote === voteType) {
      if (voteType === 1) {
        newUpvotes -= 1;
      } else if (voteType === -1) {
        newDownvotes -= 1;
      }
      newVoteScore = newUpvotes - newDownvotes;
      newUserVote = null;
    } 
    // If switching vote type
    else if (userVote !== null && userVote !== voteType) {
      if (voteType === 1) {
        newUpvotes += 1;
        newDownvotes -= 1;
      } else if (voteType === -1) {
        newDownvotes += 1;
        newUpvotes -= 1;
      }
      newVoteScore = newUpvotes - newDownvotes;
      newUserVote = voteType;
    } 
    // If new vote
    else {
      if (voteType === 1) {
        newUpvotes += 1;
      } else if (voteType === -1) {
        newDownvotes += 1;
      }
      newVoteScore = newUpvotes - newDownvotes;
      newUserVote = voteType;
    }
    
    // Update UI immediately (optimistic update)
    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);
    setVoteScore(newVoteScore);
    setUserVote(newUserVote);
    
    // Show feedback message
    if (userVote === voteType) {
      showMessage('The vote has been cancelled');
    } else {
      showMessage(voteType === 1 ? 'Liked' : 'Disliked');
    }
    
    // Send request to server
    setLoading(true);
    try {
      console.log(`Submitting vote: type=${voteType}`);
      const response = await createOrUpdateVote(routeId, voteType);
      console.log('Vote response:', response);
      
      if (response.success) {
        // Update state with actual server data
        setUpvotes(response.upvotes || 0);
        setDownvotes(response.downvotes || 0);
        setVoteScore(response.vote_score || 0);
        setUserVote(response.user_vote);
        
        console.log('Updated state after vote:', {
          upvotes: response.upvotes || 0,
          downvotes: response.downvotes || 0,
          voteScore: response.vote_score || 0,
          userVote: response.user_vote
        });
        
        // Notify parent component if callback provided
        if (onVoteChange) {
          onVoteChange();
        }
      } else {
        // Server error - rollback UI changes
        setUpvotes(previousState.upvotes);
        setDownvotes(previousState.downvotes);
        setVoteScore(previousState.voteScore);
        setUserVote(previousState.userVote);
        showMessage('Voting failed, please try again later', 'error');
      }
    } catch (error) {
      console.error('Vote error:', error);
      // Exception - rollback UI changes
      setUpvotes(previousState.upvotes);
      setDownvotes(previousState.downvotes);
      setVoteScore(previousState.voteScore);
      setUserVote(previousState.userVote);
      showMessage(error.message || 'Voting failed, please try again later', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Upvote section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={userVote === 1 ? "Remove like" : "Like"}>
          <Button
            color={userVote === 1 ? "primary" : "default"}
            variant={userVote === 1 ? "contained" : "outlined"}
            size="small"
            sx={{ 
              minWidth: '36px',
              borderRadius: '20px 0 0 20px'
            }}
            onClick={() => handleVoteWithOptimisticUI(1)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {userVote === 1 ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
          </Button>
        </Tooltip>
        <Typography 
          variant="body2" 
          sx={{ 
            minWidth: '24px', 
            textAlign: 'center',
            fontWeight: userVote === 1 ? 'bold' : 'normal',
            color: userVote === 1 ? 'primary.main' : 'text.secondary' 
          }}
        >
          {upvotes}
        </Typography>
      </Box>
      
      {/* Divider between vote buttons */}
      <Box sx={{ mx: 1, height: '20px', borderRight: '1px solid #ddd' }} />
      
      {/* Downvote section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={userVote === -1 ? "Remove dislike" : "Dislike"}>
          <Button
            color={userVote === -1 ? "error" : "default"}
            variant={userVote === -1 ? "contained" : "outlined"}
            size="small"
            sx={{ 
              minWidth: '36px',
              borderRadius: '0 20px 20px 0'
            }}
            onClick={() => handleVoteWithOptimisticUI(-1)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {userVote === -1 ? <ThumbDown fontSize="small" /> : <ThumbDownOutlined fontSize="small" />}
          </Button>
        </Tooltip>
        <Typography 
          variant="body2" 
          sx={{ 
            minWidth: '24px', 
            textAlign: 'center',
            fontWeight: userVote === -1 ? 'bold' : 'normal',
            color: userVote === -1 ? 'error.main' : 'text.secondary' 
          }}
        >
          {downvotes}
        </Typography>
      </Box>
      
      {/* Notification system */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RouteVote;