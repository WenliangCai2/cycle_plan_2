/**
 * Application Entry Point
 * =======================
 * This module serves as the main entry point for the React application,
 * rendering the root App component and configuring performance monitoring.
 * 
 * Features:
 * - React root component initialization
 * - DOM rendering of App component
 * - StrictMode configuration for development
 * - Web vitals performance monitoring setup
 * - CSS import for global styling
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

/**
 * Initialize React root and render the App component
 * 
 * Process:
 * 1. Creates a React root at the 'root' DOM element
 * 2. Renders the App component inside StrictMode
 * 3. StrictMode helps identify potential problems during development
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Web vitals reporting configuration
 * 
 * Process:
 * 1. Initializes performance monitoring
 * 2. Can be configured to pass results to analytics services
 * 
 * To measure and report web performance metrics:
 * - Pass a function to log results (e.g., reportWebVitals(console.log))
 * - Or send to an analytics endpoint
 * 
 * Learn more: https://bit.ly/CRA-vitals
 */
reportWebVitals();