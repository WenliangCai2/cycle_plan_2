/**
 * App Component Tests
 * =======================
 * This module contains unit tests for the App component using React Testing Library,
 * ensuring the component renders correctly and contains expected elements.
 * 
 * Features:
 * - Basic render test for App component
 * - Verification of expected UI elements
 * - DOM assertions using jest-dom matchers
 * - React Testing Library integration
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test case to verify the App component renders expected content
 * 
 * Process:
 * 1. Renders the App component
 * 2. Searches for the "learn react" text in the document
 * 3. Verifies that the text is present in the rendered output
 * 
 * This test ensures the basic functionality of the App component
 * by checking for default React content that should be displayed.
 */
test('renders learn react link', () => {
  // Render the App component into virtual DOM
  render(<App />);
  
  // Find the element containing the text "learn react" (case insensitive)
  const linkElement = screen.getByText(/learn react/i);
  
  // Assert that the element is present in the document
  expect(linkElement).toBeInTheDocument();
});