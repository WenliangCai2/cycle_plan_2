/**
 * Protected Route Component
 * ======================
 * This module implements route protection for the application,
 * ensuring that authenticated routes are only accessible to logged-in users.
 * 
 * Features:
 * - Authentication verification for protected routes
 * - Automatic redirection to login page for unauthenticated users
 * - Wrapper component for use with React Router
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/authApi';

/**
 * Protected route wrapper component
 * 
 * Process:
 * 1. Checks if the user is authenticated using the authentication API
 * 2. Redirects to login page if user is not authenticated
 * 3. Renders child components if user is authenticated
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactElement} The protected route component
 */
const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // If user is not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // If user is logged in, render child components
    return children;
};

export default ProtectedRoute;