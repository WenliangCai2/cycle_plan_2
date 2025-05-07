/**
 * Jest Testing Configuration
 * =======================
 * This module sets up the testing environment for the application by importing
 * custom Jest DOM extensions that enhance test assertions for DOM elements.
 * 
 * Features:
 * - Custom Jest matchers for DOM testing
 * - Enhanced assertion capabilities for DOM elements
 * - Improved test readability with semantic matchers
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */

/**
 * Import jest-dom extensions
 * 
 * This import adds custom Jest matchers that make it easier to test DOM elements
 * by providing more semantic assertions. Examples include:
 * - toBeInTheDocument()
 * - toHaveTextContent()
 * - toHaveAttribute()
 * - toHaveClass()
 * - toBeVisible()
 * - toBeChecked()
 * - toBeDisabled()
 * - toHaveFocus()
 * 
 * For more information, see: https://github.com/testing-library/jest-dom
 */


import '@testing-library/jest-dom';