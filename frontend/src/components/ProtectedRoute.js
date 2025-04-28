import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/authApi';

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // If user is not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // If user is logged in, render child components
    return children;
};

export default ProtectedRoute; 