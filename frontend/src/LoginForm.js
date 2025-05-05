import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import GlobalStyles from '@mui/joy/GlobalStyles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import Divider from '@mui/joy/Divider';
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
import GoogleIcon from './GoogleIcon';

// 使用网络图片URL代替本地图片
const lightBgImage = "https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2";
const darkBgImage = "https://images.unsplash.com/photo-1572072393749-3ca9c8ea0831?auto=format&w=1000&dpr=2";

// ColorSchemeToggle 组件
function ColorSchemeToggle(props) {
  const { onClick, ...other } = props;
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

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

// Custom theme with dark mode as default
const customTheme = extendTheme({ defaultColorScheme: 'dark' });

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  // Login state control
  const [isLogin, setIsLogin] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSending, setCodeSending] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form submission handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    // Require at least 8 character password for registration
    if (!isLogin && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '';

      // Select interface based on current state
      if (isResettingPassword) {
        endpoint = 'http://localhost:5000/api/reset_password';
      } else {
        endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/register';
      }

      const payload = isResettingPassword
        ? { username, new_password: password, email, code}
        : isLogin
        ? { username, password }
        : { username, password, email, code };

      console.log('Sending request to:', endpoint);

      const response = await axios.post(endpoint, payload);
      console.log('Server response:', response.data);

      if (response.data.success) {
        if (isResettingPassword) {
          alert('Password reset successful! Please login.');
          setIsResettingPassword(false);
          setUsername('');
          setPassword('');
          setIsLogin(true);
        } else {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('username', username);
          onLoginSuccess(response.data.userId, username);
          navigate('/');
        }
      } else {
        setErrorMessage(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setErrorMessage(error.response?.data?.message || 'Server error, please try again later');
    } finally {
      setLoading(false);
    }
  };

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

  // Toggle between login/register mode
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };

  // Switch to password reset mode
  const switchToResetPassword = () => {
    setIsResettingPassword(true);
    setIsLogin(false);
    setErrorMessage('');
  };

  // Return to login mode
  const backToLogin = () => {
    setIsResettingPassword(false);
    setIsLogin(true);
    setErrorMessage('');
  };

  // Toggle password visibility
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
              
              {isLogin && !isResettingPassword && (
                <Button
                  variant="soft"
                  color="neutral"
                  fullWidth
                  startDecorator={<GoogleIcon />}
                >
                  Continue with Google
                </Button>
              )}
            </Stack>
            
            {isLogin && !isResettingPassword && <Divider>or</Divider>}

              <Stack sx={{ gap: 4, mt: 2 }}>
                  <form onSubmit={handleSubmit}>
                      <FormControl required>
                          <FormLabel>Username</FormLabel>
                          <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              name="username"
                          />
                      </FormControl>

                      {/* 注册和重置密码都需要输入邮箱和验证码 */}
                      {(!isLogin || isResettingPassword) && (
                          <>
                              <FormControl required>
                                  <FormLabel>Email</FormLabel>
                                  <Input
                                      type="email"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      name="email"
                                  />
                              </FormControl>

                              <FormControl required>
                                  <FormLabel>Verification Code</FormLabel>
                                  <Input
                                      value={code}
                                      onChange={(e) => setCode(e.target.value)}
                                      name="code"
                                      endDecorator={
                                          <Button
                                              size="sm"
                                              onClick={handleSendCode}
                                              disabled={codeSending || !email}
                                          >
                                              {codeSending ? 'Sending...' : 'Send Code'}
                                          </Button>
                                      }
                                  />
                              </FormControl>
                          </>
                      )}

                      <FormControl required>
                          <FormLabel>{isResettingPassword ? 'New Password' : 'Password'}</FormLabel>
                          <Input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              endDecorator={
                                  <IconButton onClick={togglePasswordVisibility}>
                                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                              }
                          />
                      </FormControl>

                      <Stack sx={{ gap: 4, mt: 2 }}>
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
          <Box component="footer" sx={{ py: 3 }}>
            <Typography level="body-xs" sx={{ textAlign: 'center' }}>
              © Route Explorer {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Box>
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
