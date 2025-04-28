import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled } from '@ant-design/icons';
import { createOrUpdateVote, getRouteVotes } from '../api/voteApi';
import { useNavigate } from 'react-router-dom';
import './RouteVote.css';

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

  // Update the UI immediately and then send the request
  const handleVoteWithOptimisticUI = async (voteType) => {
    if (!isAuthenticated) {
      message.warning('请先登录再进行投票');
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
      message.success('The vote has been cancelled.');
    } else {
      message.success(voteType === 1 ? 'Liked' : 'Disliked');
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
        message.error('Voting failed, please try again later.');
      }
    } catch (error) {
      console.error('Vote error:', error);
      // 如果发生错误，恢复之前的状态
      setUpvotes(previousState.upvotes);
      setDownvotes(previousState.downvotes);
      setVoteScore(previousState.voteScore);
      setUserVote(previousState.userVote);
      message.error(error.message || 'Voting failed, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-vote">
      <Space>
        <Button
          type="text"
          icon={userVote === 1 ? <LikeFilled /> : <LikeOutlined />}
          onClick={() => handleVoteWithOptimisticUI(1)}
          loading={loading}
          className={userVote === 1 ? 'active upvote' : 'upvote'}
        />
        <span className="vote-count upvote-count">{upvotes}</span>

         {/* If it is liked, the text will be displayed. */}
        {userVote === 1 && <span className="vote-status upvote-status">Liked</span>}

        <div className="vote-divider"></div>
        
        <Button
          type="text"
          icon={userVote === -1 ? <DislikeFilled /> : <DislikeOutlined />}
          onClick={() => handleVoteWithOptimisticUI(-1)}
          loading={loading}
          className={userVote === -1 ? 'active downvote' : 'downvote'}
        />
        <span className="vote-count downvote-count">{downvotes}</span>
        {/* If it is disliked, the text will be displayed.*/}
        {userVote === -1 && <span className="vote-status downvote-status">Disliked</span>}
      </Space>
    </div>
  );
};

export default RouteVote;