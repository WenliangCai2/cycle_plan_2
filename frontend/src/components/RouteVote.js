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
 * RouteVote Component - Allows users to upvote or downvote a route
 * @param {Object} props - Component props
 * @param {string} props.routeId - Route ID
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Function} props.onVoteChange - Optional callback when vote changes
 */
const RouteVote = ({ routeId, isAuthenticated, onVoteChange }) => {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(null); // null = not voted, 1 = upvote, -1 = downvote
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();

  // Fetch votes on component mount
  useEffect(() => {
    fetchVotes();
  }, [routeId]);

  // Fetch vote statistics
  const fetchVotes = async () => {
    try {
      const response = await getRouteVotes(routeId);
      console.log('Fetched vote data:', response);
      
      if (response.success) {
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

  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Update the UI immediately and then send the request
  const handleVoteWithOptimisticUI = async (voteType) => {
    if (!isAuthenticated) {
      showMessage('Please login to vote', 'warning');
      navigate('/login');
      return;
    }

    // Save the previous state to restore in case of error
    const previousState = {
      upvotes,
      downvotes,
      voteScore,
      userVote
    };
    
    // Calculate the new voting status based on the previous voting status and the current voting operation
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    let newVoteScore = voteScore;
    let newUserVote = voteType;
    
    // If you click on a vote of the same type that you have voted before, cancel the vote
    if (userVote === voteType) {
      if (voteType === 1) {
        newUpvotes -= 1;
      } else if (voteType === -1) {
        newDownvotes -= 1;
      }
      newVoteScore = newUpvotes - newDownvotes;
      newUserVote = null;
    } 
    // Switch voting type if you have voted a different type before
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
    // Add a new vote if there was no previous vote
    else {
      if (voteType === 1) {
        newUpvotes += 1;
      } else if (voteType === -1) {
        newDownvotes += 1;
      }
      newVoteScore = newUpvotes - newDownvotes;
      newUserVote = voteType;
    }
    
    // Update UI now
    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);
    setVoteScore(newVoteScore);
    setUserVote(newUserVote);
    
    // Display a temporary success message
    if (userVote === voteType) {
      showMessage('The vote has been cancelled');
    } else {
      showMessage(voteType === 1 ? 'Liked' : 'Disliked');
    }
    
    // Send a request to the server
    setLoading(true);
    try {
      console.log(`Submitting vote: type=${voteType}`);
      const response = await createOrUpdateVote(routeId, voteType);
      console.log('Vote response:', response);
      
      if (response.success) {
        // Update the UI with the actual data returned by the server
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
        
        // Notify the parent component that the vote has changed
        if (onVoteChange) {
          onVoteChange();
        }
      } else {
        // If the server fails to respond, restore the previous state
        setUpvotes(previousState.upvotes);
        setDownvotes(previousState.downvotes);
        setVoteScore(previousState.voteScore);
        setUserVote(previousState.userVote);
        showMessage('Voting failed, please try again later', 'error');
      }
    } catch (error) {
      console.error('Vote error:', error);
      // 如果发生错误，恢复之前的状态
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
      
      <Box sx={{ mx: 1, height: '20px', borderRight: '1px solid #ddd' }} />
      
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