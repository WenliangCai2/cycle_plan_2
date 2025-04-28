import React, { useState } from 'react';
import { Button, Modal, Tooltip, message, Space, Switch } from 'antd';
import { FacebookOutlined, TwitterOutlined, WhatsAppOutlined, ShareAltOutlined, CopyOutlined, GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { shareRoute, updateRouteVisibility } from '../api/routeApi';

/**
 * Route sharing component
 * @param {Object} props
 * @param {string} props.routeId - Route ID
 * @param {boolean} props.isPublic - Whether the route is public
 * @param {function} props.onVisibilityChange - Callback after visibility change
 */
const ShareRoute = ({ routeId, isPublic, onVisibilityChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publicSwitch, setPublicSwitch] = useState(isPublic);

  // Open share modal
  const showModal = async () => {
    setLoading(true);
    
    try {
      // Get share links
      const response = await shareRoute(routeId);
      setShareLinks(response.social_links);
      setIsModalOpen(true);
    } catch (error) {
      message.error('Failed to get sharing links');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Close share modal
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Copy share link
  const copyShareLink = () => {
    if (!shareLinks) return;
    
    navigator.clipboard.writeText(shareLinks.share_url)
      .then(() => {
        message.success('Link copied to clipboard');
      })
      .catch(err => {
        message.error('Failed to copy link');
        console.error(err);
      });
  };

  // Update route visibility
  const handleVisibilityChange = async (checked) => {
    setLoading(true);
    
    try {
      await updateRouteVisibility(routeId, checked);
      setPublicSwitch(checked);
      
      if (onVisibilityChange) {
        onVisibilityChange(checked);
      }
      
      message.success(checked ? 'Route is now public' : 'Route is now private');
    } catch (error) {
      message.error('Failed to update route visibility');
      console.error(error);
      // Restore switch state
      setPublicSwitch(isPublic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Space>
        <Tooltip title="Share Route">
          <Button 
            type="primary" 
            icon={<ShareAltOutlined />} 
            onClick={showModal}
            loading={loading}
          >
            Share
          </Button>
        </Tooltip>
        
        <Tooltip title={publicSwitch ? "Public Route" : "Private Route"}>
          <Switch
            checkedChildren={<GlobalOutlined />}
            unCheckedChildren={<LockOutlined />}
            checked={publicSwitch}
            onChange={handleVisibilityChange}
            loading={loading}
          />
        </Tooltip>
      </Space>

      <Modal
        title="Share Route"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        {shareLinks && (
          <div className="share-links">
            <p>Choose a platform to share:</p>
            <Space size="large">
              <Tooltip title="Share to Facebook">
                <a 
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    shape="circle" 
                    icon={<FacebookOutlined />} 
                    size="large"
                    style={{ backgroundColor: '#3b5998', color: 'white' }}
                  />
                </a>
              </Tooltip>
              
              <Tooltip title="Share to Twitter">
                <a 
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    shape="circle" 
                    icon={<TwitterOutlined />} 
                    size="large"
                    style={{ backgroundColor: '#1DA1F2', color: 'white' }}
                  />
                </a>
              </Tooltip>
              
              <Tooltip title="Share to WhatsApp">
                <a 
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    shape="circle" 
                    icon={<WhatsAppOutlined />} 
                    size="large"
                    style={{ backgroundColor: '#25D366', color: 'white' }}
                  />
                </a>
              </Tooltip>
              
              <Tooltip title="Copy Link">
                <Button 
                  shape="circle" 
                  icon={<CopyOutlined />} 
                  size="large"
                  onClick={copyShareLink}
                />
              </Tooltip>
            </Space>
            
            <div style={{ marginTop: '20px' }}>
              <p>Share link:</p>
              <div className="share-url">
                {shareLinks.share_url}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ShareRoute; 