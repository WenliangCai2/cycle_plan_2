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
 * Route sharing component with Material UI styling
 * @param {Object} props
 * @param {string} props.routeId - Route ID
 * @param {boolean} props.isPublic - Whether the route is public
 * @param {function} props.onVisibilityChange - Callback after visibility change
 * @param {boolean} props.hideControls - Whether to hide the public/private controls
 */
const ShareRoute = ({ routeId, isPublic, onVisibilityChange, isOwner, hideControls, id }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publicSwitch, setPublicSwitch] = useState(isPublic);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Open share modal
  const showModal = async () => {
    setLoading(true);
    
    try {
      // Get share links
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

  // Close share modal
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };

  // Copy share link
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

  // Update route visibility
  const handleVisibilityChange = async (event) => {
    const checked = event.target.checked;
    setLoading(true);

    try {
      const result = await updateRouteVisibility(routeId, checked);
      setPublicSwitch(checked);

      if (onVisibilityChange) {
        onVisibilityChange(checked);
      }

      setSnackbar({
        open: true,
        message: checked ? 'Route is now public' : 'Route is now private',
        severity: 'success'
      });
    } catch (error) {
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

  const socialIconStyle = {
    width: 40,
    height: 40
  };

  return (
    <>
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
              
              <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
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