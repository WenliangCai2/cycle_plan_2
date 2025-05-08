/**
 * Login Form Component
 * =======================
 * This module provides a comprehensive authentication interface with login,
 * registration, and password reset functionality in a visually appealing layout.
 * 
 * Features:
 * - User authentication (login and registration)
 * - Password reset workflow
 * - Email verification system
 * - Dark/light mode toggle
 * - Responsive design for different devices
 * - Visual feedback for loading and error states
 * - Password visibility toggle
 * - Form validation
 * - Background images that change with theme
 * - Session storage with localStorage
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import GlobalStyles from '@mui/joy/GlobalStyles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import IconButton from '@mui/joy/IconButton';
import Link from '@mui/joy/Link';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Alert from '@mui/joy/Alert';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExploreIcon from '@mui/icons-material/Explore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Background images for light/dark themes
const lightBgImage = "https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2";
const darkBgImage = "https://images.unsplash.com/photo-1572072393749-3ca9c8ea0831?auto=format&w=1000&dpr=2";

/**
 * ColorSchemeToggle component for switching between light and dark modes
 * 
 * Process:
 * 1. Tracks mounted state to prevent hydration issues
 * 2. Reads and updates color scheme from context
 * 3. Toggles between light and dark modes on click
 * 4. Shows appropriate icon based on current mode
 * 
 * Args:
 *   props (Object): Component props including onClick handler and other props
 * 
 * Returns:
 *   IconButton component for toggling color mode
 */
function ColorSchemeToggle(props) {
  const { onClick, ...other } = props;
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration issues by waiting for component to mount
  React.useEffect(() => setMounted(true), []);

  return (
    <IconButton
      aria-label="Toggle light/dark mode"
      size="sm"
      variant="outlined"
      disabled={!mounted}
      onClick={(event) => {
        setMode(mode === 'light' ? 'dark' : 'light');
        onClick?.(event);
      }}
      {...other}
    >
      {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
    </IconButton>
  );
}

// Custom theme configuration with dark mode as default
const customTheme = extendTheme({ defaultColorScheme: 'dark' });

/**
 * LoginForm component providing authentication interface
 * 
 * Process:
 * 1. Manages state for different authentication modes (login, register, reset)
 * 2. Handles form submission for all authentication actions
 * 3. Manages email verification code system
 * 4. Provides visual feedback for errors and loading states
 * 5. Stores authentication tokens on successful login
 * 
 * Args:
 *   onLoginSuccess (Function): Callback for successful login with user info
 * 
 * Returns:
 *   Complete authentication interface with responsive design
 */
const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  
  // Authentication mode state
  const [isLogin, setIsLogin] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Form field states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [codeSending, setCodeSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission for all authentication actions
   * 
   * Process:
   * 1. Validates form inputs
   * 2. Determines appropriate endpoint based on current mode
   * 3. Sends authentication request to backend API
   * 4. Processes response and updates UI accordingly
   * 5. Stores authentication data on successful login
   * 
   * Args:
   *   event (Event): Form submission event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    // Validate password length for registration
    if (!isLogin && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '';

      // Select endpoint based on current mode
      if (isResettingPassword) {
        endpoint = 'http://localhost:5000/api/reset_password';
      } else {
        endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/register';
      }

      // Build appropriate payload based on current mode
      const payload = isResettingPassword
        ? { username, new_password: password, email, code}
        : isLogin
        ? { username, password }
        : { username, password, email, code };

      console.log('Sending request to:', endpoint);

      // Send authentication request
      const response = await axios.post(endpoint, payload);
      console.log('Server response:', response.data);

      // Handle successful response
      if (response.data.success) {
        if (isResettingPassword) {
          // Show success message and return to login
          alert('Password reset successful! Please login.');
          setIsResettingPassword(false);
          setUsername('');
          setPassword('');
          setIsLogin(true);
        } else {
          // Store authentication data and navigate to main page
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('username', username);
          onLoginSuccess(response.data.userId, username);
          navigate('/mainPage');
        }
      } else {
        // Display error message from server
        setErrorMessage(response.data.message || 'Operation failed');
      }
    } catch (error) {
      // Handle request errors
      console.error('Authentication failed:', error);
      setErrorMessage(error.response?.data?.message || 'Server error, please try again later');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send verification code to user's email
   * 
   * Process:
   * 1. Validates email is provided
   * 2. Sets loading state for UI feedback
   * 3. Sends verification code request to backend API
   * 4. Displays success or error message
   */
  const handleSendCode = async () => {
      if (!email) {
          setErrorMessage('Please enter your email first');
          return;
      }
      setCodeSending(true);
      try {
          const res = await axios.post('http://localhost:5000/api/send_verification_code', {
              email,
              purpose: isResettingPassword ? 'reset' : 'register',
          });
          if (res.data.success) {
              alert('Verification code sent to your email successfully!');
          } else {
              setErrorMessage(res.data.message);
          }
      } catch (err) {
          console.error('Send code error:', err);
          setErrorMessage('Failed to send code');
      } finally {
          setCodeSending(false);
      }
  };

  /**
   * Toggle between login and registration modes
   * 
   * Process:
   * 1. Inverts current login state
   * 2. Clears any previous error messages
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };

  /**
   * Switch to password reset mode
   * 
   * Process:
   * 1. Sets resetting password flag to true
   * 2. Sets login flag to false
   * 3. Clears any previous error messages
   */
  const switchToResetPassword = () => {
    setIsResettingPassword(true);
    setIsLogin(false);
    setErrorMessage('');
  };

  /**
   * Return to login mode from password reset
   * 
   * Process:
   * 1. Sets resetting password flag to false
   * 2. Sets login flag to true
   * 3. Clears any previous error messages
   */
  const backToLogin = () => {
    setIsResettingPassword(false);
    setIsLogin(true);
    setErrorMessage('');
  };
  
  /**
   * Toggle password visibility
   * 
   * Process:
   * 1. Inverts current showPassword state
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <CssVarsProvider theme={customTheme} disableTransitionOnChange>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            '--Form-maxWidth': '800px',
            '--Transition-duration': '0.4s', // set to 'none' to disable transition
          },
        }}
      />
      {/* Left side form container */}
      <Box
        sx={(theme) => ({
          width: { xs: '100%', md: '50vw' },
          transition: 'width var(--Transition-duration)',
          transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255 255 255 / 0.2)',
          [theme.getColorSchemeSelector('dark')]: {
            backgroundColor: 'rgba(19 19 24 / 0.4)',
          },
        })}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh',
            width: '100%',
            px: 2,
          }}
        >
          {/* Header with logo and theme toggle */}
          <Box
            component="header"
            sx={{ py: 3, display: 'flex', justifyContent: 'space-between' }}
          >
            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <IconButton variant="soft" color="primary" size="sm">
                <ExploreIcon />
              </IconButton>
              <Typography level="title-lg">Route Explorer</Typography>
            </Box>
            <ColorSchemeToggle />
          </Box>
          
          {/* Main form container */}
          <Box
            component="main"
            sx={{
              my: 'auto',
              py: 2,
              pb: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: 400,
              maxWidth: '100%',
              mx: 'auto',
              borderRadius: 'sm',
              '& form': {
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              },
              [`& .MuiFormLabel-asterisk`]: {
                visibility: 'hidden',
              },
            }}
          >
            {/* Back button for password reset mode */}
            {isResettingPassword && (
              <IconButton 
                onClick={backToLogin} 
                sx={{ alignSelf: 'flex-start', mb: 1 }}
                variant="outlined"
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            
            {/* Error message display */}
            {errorMessage && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            
            {/* Form header */}
            <Stack sx={{ gap: 4, mb: 2 }}>
              <Stack sx={{ gap: 1 }}>
                <Typography component="h1" level="h3">
                  {isResettingPassword
                    ? 'Reset Password'
                    : isLogin
                      ? 'Sign In'
                      : 'Register'}
                </Typography>
                {!isResettingPassword && (
                  <Typography level="body-sm">
                    {isLogin ? 'New to our platform?' : 'Already have an account?'}{' '}
                    <Link href="#" level="title-sm" onClick={toggleMode}>
                      {isLogin ? 'Register now!' : 'Sign in!'}
                    </Link>
                  </Typography>
                )}
              </Stack>
            </Stack>
            
            {/* Form fields */}
            <Stack sx={{ gap: 4, mt: 2 }}>
                  <form onSubmit={handleSubmit}>
                      {/* Username field */}
                      <FormControl required>
                          <FormLabel>Username</FormLabel>
                          <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              name="username"
                          />
                      </FormControl>

                      {/* Email and verification code fields - only for registration and password reset */}
                      {(isResettingPassword || !isLogin) && (
                          <>
                              <FormControl required>
                                  <FormLabel>Email</FormLabel>
                                  <Input
                                      type="email"
                                      placeholder="Enter your email"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                  />
                              </FormControl>
                              <FormControl required sx={{ gap: 1, mb: 1 }}>
                                  <FormLabel>Verification Code</FormLabel>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Input
                                          placeholder="Enter verification code"
                                          value={code}
                                          onChange={(e) => setCode(e.target.value)}
                                          sx={{ flex: 1 }}
                                      />
                                      <Button
                                          variant="soft"
                                          color="primary"
                                          onClick={handleSendCode}
                                          disabled={codeSending || !email}
                                          endDecorator={codeSending ? '...' : null}
                                      >
                                          Send Code
                                      </Button>
                                  </Box>
                              </FormControl>
                          </>
                      )}

                      {/* Password field */}
                      <FormControl required>
                          <FormLabel>{isResettingPassword ? 'New Password' : 'Password'}</FormLabel>
                          <Input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              endDecorator={
                                  <IconButton
                                      size="sm"
                                      onClick={togglePasswordVisibility}
                                  >
                                      {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                  </IconButton>
                              }
                          />
                      </FormControl>

                      <Stack sx={{ gap: 4, mt: 2 }}>
                          {/* Remember me and forgot password - only for login mode */}
                          {isLogin && !isResettingPassword && (
                              <Box
                                  sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                  }}
                              >
                                  <Checkbox size="sm" label="Remember me" name="persistent" />
                                  <Link
                                      level="title-sm"
                                      href="#"
                                      onClick={switchToResetPassword}
                                  >
                                      Forgot password?
                                  </Link>
                              </Box>
                          )}

                          {/* Submit button */}
                          <Button
                              type="submit"
                              fullWidth
                              loading={loading}
                          >
                              {isResettingPassword
                                  ? 'Reset Password'
                                  : isLogin
                                      ? 'Sign In'
                                      : 'Register'}
                          </Button>
                      </Stack>
                  </form>
              </Stack>
          </Box>
          
          {/* Footer */}
          <Box component="footer" sx={{ py: 3 }}>
            <Typography level="body-xs" sx={{ textAlign: 'center' }}>
              © Route Explorer {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Right side background image */}
      <Box
        sx={(theme) => ({
          height: '100%',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          left: { xs: 0, md: '50vw' },
          transition:
            'background-image var(--Transition-duration), left var(--Transition-duration) !important',
          transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
          backgroundColor: 'background.level1',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `url(${lightBgImage})`,
          [theme.getColorSchemeSelector('dark')]: {
            backgroundImage: `url(${darkBgImage})`,
          },
        })}
      />
    </CssVarsProvider>
  );
};

export default LoginForm;