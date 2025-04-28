import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



const LoginForm = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Requires password of more than 8-digits
        if (!isLogin && password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.');
            return;
        }

        try {
            let endpoint = '';

            // Select interface according to status
            if (isResettingPassword) {
                endpoint = 'http://localhost:5000/api/reset_password';
            } else {
                endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/register';
            }

            const payload = isResettingPassword
                ? { username, new_password: password }
                : { username, password };

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
                    onLoginSuccess(response.data.userId);
                    navigate('/');
                }
            } else {
                setErrorMessage(response.data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            setErrorMessage(error.response?.data?.message || 'Server error, please try again later');
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrorMessage('');
    };

    const switchToResetPassword = () => { // Switch to password reset mode
        setIsResettingPassword(true);
        setIsLogin(false);
        setErrorMessage('');
    };

    const backToLogin = () => { // Return to login mode after resetting
        setIsResettingPassword(false);
        setIsLogin(true);
        setErrorMessage('');
    };


    return (
        <div style={styles.container}>
            <div style={styles.formCard}>
                <h2 style={styles.title}>
                    {isResettingPassword
                        ? 'Reset Password'
                        : isLogin
                            ? 'User Login'
                            : 'User Registration'}
                </h2>

                {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            {isResettingPassword ? 'New Password' : 'Password'}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button}>
                        {isResettingPassword
                            ? 'Reset Password'
                            : isLogin
                                ? 'Login'
                                : 'Register'}
                    </button>
                </form>

                <div style={styles.switchMode}>
                    {isResettingPassword ? (
                        <>
                            <span>Remembered your password?</span>
                            <button onClick={backToLogin} style={styles.switchButton}>
                                Back to Login
                            </button>
                        </>
                    ) : (
                        <>
                            <span>{isLogin ? 'No account?' : 'Already have an account?'}</span>
                            <button onClick={toggleMode} style={styles.switchButton}>
                                {isLogin ? 'Register' : 'Login'}
                            </button>
                            {isLogin && (
                                <>
                                    <br />
                                    <button onClick={switchToResetPassword} style={styles.switchButton}>
                                        Forgot Password?
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        width: '350px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '24px',
        color: '#333',
        fontSize: '24px',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#f44336',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px',
    },
    switchMode: {
        marginTop: '16px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666',
    },
    switchButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        fontSize: '14px',
        marginLeft: '4px',
    }
};

export default LoginForm;
