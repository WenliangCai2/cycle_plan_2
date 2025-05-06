/**
 * Header Component
 * =======================
 * This module provides the application header with navigation and user controls.
 * 
 * Features:
 * - Responsive layout with mobile drawer for smaller screens
 * - User authentication status detection
 * - Dynamic menu system based on authentication state
 * - User profile dropdown menu
 * - Notifications panel
 * - Light/dark mode toggle
 * - Mobile-friendly navigation drawer
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Avatar, Dropdown, Badge, Space, Tooltip } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MenuOutlined, UserOutlined, BellOutlined, HeartOutlined, 
  LogoutOutlined, SettingOutlined, CompassOutlined,
  PlusOutlined, EditOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/userSlice';
import logo from '../assets/images/logo.png';
import ColorModeToggle from './ColorModeToggle';
import NotificationsPanel from './NotificationsPanel';

// Extract Ant Design Header component for better readability
const { Header: AntHeader } = Layout;

/**
 * Header component that displays the application navigation bar
 * 
 * Process:
 * 1. Manages authentication state detection
 * 2. Handles responsive layout for desktop and mobile
 * 3. Provides user menu with profile and action links
 * 4. Manages notification display
 * 5. Handles user logout process
 * 
 * Returns:
 *   The application header with navigation controls
 */
const Header = () => {
  // State for mobile drawer visibility
  const [visible, setVisible] = useState(false);
  
  // State for notifications panel visibility
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  
  // Router hooks for navigation and location tracking
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get authentication state from Redux store with localStorage fallback
  const isAuthenticated = useSelector(state => state.user?.isAuthenticated) || !!localStorage.getItem('token');
  
  // Get current user data with fallbacks
  const currentUser = useSelector(state => state.user?.currentUser);
  const username = localStorage.getItem('username') || (currentUser?.username) || 'User';
  const userId = localStorage.getItem('userId') || (currentUser?.id);
  
  // Get notifications from Redux store with empty array fallback
  const notifications = useSelector(state => state.notifications?.items) || [];
  
  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  /**
   * Reset drawer visibility when route changes
   * 
   * Process:
   * 1. Watches for changes in location pathname
   * 2. Closes the mobile drawer when navigation occurs
   */
  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  /**
   * Handle user logout process
   * 
   * Process:
   * 1. Dispatches logout action to Redux if available
   * 2. Falls back to manual localStorage cleanup if Redux unavailable
   * 3. Navigates user to home page after logout
   */
  const handleLogout = () => {
    if (dispatch) {
      // Use Redux action for logout if available
      dispatch(logout());
    } else {
      // Fallback logout handling if Redux is not available
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    }
    // Navigate to home page after logout
    navigate('/');
  };

  // User dropdown menu items configuration
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to={`/users/${userId}`}>Profile</Link>
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">My Favorites</Link>
    },
    {
      key: 'add-route',
      icon: <PlusOutlined />,
      label: <Link to="/routes/new">Add Route</Link>
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span onClick={handleLogout}>Logout</span>
    }
  ];

  // Main navigation items configuration
  const navItems = [
    {
      key: 'routes',
      icon: <CompassOutlined />,
      label: <Link to="/routes">Routes</Link>
    },
    {
      key: 'map',
      icon: <EditOutlined />,
      label: <Link to="/planner">Route Planner</Link>
    }
  ];

  return (
    <AntHeader className="app-header">
      <div className="header-content">
        {/* Left side: Logo and desktop navigation */}
        <div className="header-left">
          <Link to="/" className="logo">
            <img src={logo} alt="Route Explorer" height="32" />
            <span className="logo-text">Route Explorer</span>
          </Link>
          
          {/* Desktop navigation menu */}
          <div className="desktop-menu">
            <Menu 
              mode="horizontal" 
              selectedKeys={[location.pathname.split('/')[1] || 'home']}
              items={navItems}
            />
          </div>
        </div>
        
        {/* Right side: User controls and mobile menu button */}
        <div className="header-right">
          <Space>
            {/* Color mode toggle component */}
            <ColorModeToggle />
            
            {/* Conditional rendering based on authentication status */}
            {isAuthenticated ? (
              <>
                {/* Notifications button with unread badge */}
                <Tooltip title="Notifications">
                  <Badge count={unreadCount} size="small">
                    <Button 
                      icon={<BellOutlined />} 
                      type="text"
                      onClick={() => setNotificationsVisible(true)}
                    />
                  </Badge>
                </Tooltip>
                
                {/* User profile dropdown */}
                <Dropdown 
                  menu={{ items: userMenuItems }} 
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button type="text">
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      {username}
                    </Space>
                  </Button>
                </Dropdown>
              </>
            ) : (
              // Login/Register buttons for non-authenticated users
              <Space>
                <Button type="link" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </Space>
            )}
            
            {/* Mobile menu button - only visible on small screens via CSS */}
            <Button 
              className="mobile-menu-button"
              icon={<MenuOutlined />} 
              type="text"
              onClick={() => setVisible(true)}
            />
          </Space>
        </div>
      </div>
      
      {/* Mobile navigation drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setVisible(false)}
        open={visible}
      >
        {/* Show user info if authenticated */}
        {isAuthenticated && (
          <div style={{ padding: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
            <span>{username}</span>
          </div>
        )}
        
        {/* Mobile navigation menu */}
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname.split('/')[1] || 'home']}
          items={[
            // Home item added for mobile menu
            {
              key: 'home',
              label: <Link to="/">Home</Link>
            },
            // Include main navigation items
            ...navItems,
            // Conditionally show user menu or login/register based on auth status
            ...(isAuthenticated 
              ? userMenuItems.filter(item => item.key !== 'logout')
              : [
                  {
                    key: 'login',
                    label: <Link to="/login">Login</Link>
                  },
                  {
                    key: 'register',
                    label: <Link to="/register">Register</Link>
                  }
                ]
            )
          ]}
        />
        
        {/* Show logout button at bottom of drawer if authenticated */}
        {isAuthenticated && (
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ marginTop: 16, width: '100%' }}
          >
            Logout
          </Button>
        )}
      </Drawer>
      
      {/* Notifications panel - rendered but conditionally visible */}
      <NotificationsPanel
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </AntHeader>
  );
};

export default Header;