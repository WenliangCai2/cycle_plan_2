import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Avatar, Dropdown, Badge, Space, Tooltip } from 'antd';
import { Link, useLocation, useHistory } from 'react-router-dom';
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

const { Header: AntHeader } = Layout;

const Header = () => {
  const [visible, setVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();
  
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  const currentUser = useSelector(state => state.user.currentUser);
  const notifications = useSelector(state => state.notifications.items);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Reset drawer visibility on location change
  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    history.push('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to={`/users/${currentUser?.id}`}>Profile</Link>
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
        <div className="header-left">
          <Link to="/" className="logo">
            <img src={logo} alt="Route Explorer" height="32" />
            <span className="logo-text">Route Explorer</span>
          </Link>
          
          <div className="desktop-menu">
            <Menu 
              mode="horizontal" 
              selectedKeys={[location.pathname.split('/')[1] || 'home']}
              items={navItems}
            />
          </div>
        </div>
        
        <div className="header-right">
          <Space>
            <ColorModeToggle />
            
            {isAuthenticated ? (
              <>
                <Tooltip title="Notifications">
                  <Badge count={unreadCount} size="small">
                    <Button 
                      icon={<BellOutlined />} 
                      type="text"
                      onClick={() => setNotificationsVisible(true)}
                    />
                  </Badge>
                </Tooltip>
                
                <Dropdown 
                  menu={{ items: userMenuItems }} 
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Avatar 
                    src={currentUser?.avatar} 
                    icon={!currentUser?.avatar && <UserOutlined />}
                    style={{ cursor: 'pointer' }}
                  />
                </Dropdown>
              </>
            ) : (
              <Space>
                <Button type="link" onClick={() => history.push('/login')}>
                  Login
                </Button>
                <Button type="primary" onClick={() => history.push('/register')}>
                  Register
                </Button>
              </Space>
            )}
            
            <Button 
              className="mobile-menu-button"
              icon={<MenuOutlined />} 
              type="text"
              onClick={() => setVisible(true)}
            />
          </Space>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setVisible(false)}
        open={visible}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname.split('/')[1] || 'home']}
          items={[
            {
              key: 'home',
              label: <Link to="/">Home</Link>
            },
            ...navItems,
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
      
      {/* Notifications Panel */}
      <NotificationsPanel
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </AntHeader>
  );
};

export default Header; 