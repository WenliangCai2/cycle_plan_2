/**
 * Share Route Component
 * =======================
 * This module provides a sharing interface for routes with social media integration
 * and route visibility controls.
 * 
 * Features:
 * - Route sharing to popular social platforms (Facebook, Twitter, WhatsApp)
 * - Direct link copying to clipboard
 * - Public/private visibility toggle for route owners
 * - Modal dialog for sharing options
 * - Notification system for user feedback
 * - Loading state management with visual indicators
 * - Responsive design for various device sizes
 * - Context-sensitive controls based on user ownership
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState } from 'react';
import { shareRoute, updateRouteVisibility } from '../api/routeApi';

// Material UI imports
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';

// Material UI icons
import {
  Share as ShareIcon,
  PublicOutlined,
  LockOutlined,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

/**
 * Route sharing component with social media integration
 * 
 * Process:
 * 1. Provides share button and public/private toggle
 * 2. Displays sharing modal with social media options
 * 3. Handles route visibility changes for owners
 * 4. Manages clipboard operations for direct link sharing
 * 5. Shows notifications for user actions
 * 
 * Args:
 *   routeId (String/Number): ID of the route to share
 *   isPublic (Boolean): Whether the route is currently public
 *   onVisibilityChange (Function): Callback after visibility change
 *   isOwner (Boolean): Whether current user owns the route
 *   hideControls (Boolean): Whether to hide visibility controls
 *   id (String): Optional ID for the share button element
 * 
 * Returns:
 *   Sharing interface with button, modal, and notifications
 */
const ShareRoute = ({ routeId, isPublic, onVisibilityChange, isOwner, hideControls, id }) => {
  // State for modal and sharing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publicSwitch, setPublicSwitch] = useState(isPublic);
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  /**
   * Open sharing modal and fetch sharing links
   * 
   * Process:
   * 1. Sets loading state for UI feedback
   * 2. Fetches sharing links from API
   * 3. Opens modal with sharing options
   * 4. Handles errors with notifications
   */
  const showModal = async () => {
    setLoading(true);
    
    try {
      // Get share links from API
      const response = await shareRoute(routeId);
      setShareLinks({
        ...response.social_links,
        share_url: response.share_url
      });
      setIsModalOpen(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to get sharing links',
        severity: 'error'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close sharing modal
   * 
   * Process:
   * 1. Updates modal open state to close it
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
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
   * Copy share link to clipboard
   * 
   * Process:
   * 1. Verifies share links are available
   * 2. Uses clipboard API to copy the URL
   * 3. Shows success or error notification
   */
  const copyShareLink = () => {
    if (!shareLinks) return;
    
    navigator.clipboard.writeText(shareLinks.share_url)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Link copied to clipboard',
          severity: 'success'
        });
      })
      .catch(err => {
        setSnackbar({
          open: true,
          message: 'Failed to copy link',
          severity: 'error'
        });
        console.error(err);
      });
  };

  /**
   * Update route visibility (public/private)
   * 
   * Process:
   * 1. Gets new visibility state from event
   * 2. Sets loading state for UI feedback
   * 3. Sends update request to API
   * 4. Updates local state and notifies parent
   * 5. Handles errors with notifications
   * 
   * Args:
   *   event (Event): Switch change event
   */
  const handleVisibilityChange = async (event) => {
    const checked = event.target.checked;
    setLoading(true);

    try {
      // Update visibility with API
      const result = await updateRouteVisibility(routeId, checked);
      setPublicSwitch(checked);

      // Notify parent component if callback provided
      if (onVisibilityChange) {
        onVisibilityChange(checked);
      }

      // Show success notification
      setSnackbar({
        open: true,
        message: checked ? 'Route is now public' : 'Route is now private',
        severity: 'success'
      });
    } catch (error) {
      // Show error and revert state
      setSnackbar({
        open: true,
        message: 'Failed to update route visibility',
        severity: 'error'
      });
      setPublicSwitch((prev) => !prev);
    } finally {
      setLoading(false);
    }
  };

  // Style for social media icons
  const socialIconStyle = {
    width: 40,
    height: 40
  };

  return (
    <>
      {/* Share button and visibility toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Share Route">
          <Button 
            variant="contained" 
            startIcon={<ShareIcon />} 
            onClick={showModal}
            disabled={loading}
            sx={{ mr: hideControls ? 0 : 1, borderRadius: '20px' }}
            size="small"
            id={id}
          >
            Share
          </Button>
        </Tooltip>

        {/* Visibility toggle - only shown for route owners when not hidden */}
        {!hideControls && (
          <FormControlLabel
            control={
              <Switch
                checked={publicSwitch}
                onChange={handleVisibilityChange}
                disabled={!isOwner || loading}
                icon={<LockOutlined />}
                checkedIcon={<PublicOutlined />}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                {publicSwitch ? "Public" : "Private"}
              </Typography>
            }
            sx={{ ml: 0 }}
          />
        )}
      </Box>

      {/* Share modal dialog */}
      <Dialog
        open={isModalOpen}
        onClose={handleModalClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Route
        </DialogTitle>
        
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : shareLinks && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Choose a platform to share:
              </Typography>
              
              {/* Social media sharing buttons */}
              <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                {/* Facebook */}
                <Grid item>
                  <Tooltip title="Share to Facebook">
                    <IconButton
                      component="a"
                      href={shareLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        ...socialIconStyle, 
                        color: 'white', 
                        bgcolor: '#3b5998',
                        '&:hover': { bgcolor: '#324b80' } 
                      }}
                    >
                      <FacebookIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                {/* Twitter */}
                <Grid item>
                  <Tooltip title="Share to Twitter">
                    <IconButton
                      component="a"
                      href={shareLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        ...socialIconStyle, 
                        color: 'white', 
                        bgcolor: '#1DA1F2',
                        '&:hover': { bgcolor: '#0d8edc' } 
                      }}
                    >
                      <TwitterIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                {/* WhatsApp */}
                <Grid item>
                  <Tooltip title="Share to WhatsApp">
                    <IconButton
                      component="a"
                      href={shareLinks.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        ...socialIconStyle, 
                        color: 'white', 
                        bgcolor: '#25D366',
                        '&:hover': { bgcolor: '#1eb958' } 
                      }}
                    >
                      <WhatsAppIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                {/* Copy link button */}
                <Grid item>
                  <Tooltip title="Copy Link">
                    <IconButton
                      onClick={copyShareLink}
                      sx={{ 
                        ...socialIconStyle, 
                        color: 'white', 
                        bgcolor: '#607d8b',
                        '&:hover': { bgcolor: '#4b636e' } 
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
              
              {/* Direct link section */}
              <Typography variant="subtitle1" gutterBottom>
                Share link:
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 1 
              }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={shareLinks.share_url}
                  InputProps={{
                    readOnly: true,
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyShareLink}
                  sx={{ ml: 1, whiteSpace: 'nowrap' }}
                >
                  Copy
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleModalClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification snackbar */}
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
    </>
  );
};

export default ShareRoute;