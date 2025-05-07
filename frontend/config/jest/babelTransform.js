/**
 * Babel Jest Transformer
 * =======================
 * This module provides a custom Jest transformer that processes JavaScript
 * files through Babel before testing, configuring the JSX runtime.
 * 
 * Features:
 * - Babel integration for Jest
 * - JSX runtime detection and configuration
 * - Support for both classic and automatic JSX runtime
 * - Consistent transformation settings with webpack
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

const babelJest = require('babel-jest').default;

/**
 * Detect if the new JSX runtime is available
 * 
 * Process:
 * 1. Checks if DISABLE_NEW_JSX_TRANSFORM environment variable is set
 * 2. Attempts to resolve react/jsx-runtime
 * 3. Returns true if available, false otherwise
 * 
 * Returns:
 *   Boolean: Whether JSX runtime is available
 */
const hasJsxRuntime = (() => {
  // Return false if explicitly disabled by environment variable
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  // Attempt to resolve react/jsx-runtime module
  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

/**
 * Create and export a Babel transformer for Jest
 * 
 * Process:
 * 1. Configures babel-preset-react-app
 * 2. Sets JSX runtime based on availability
 * 3. Disables babelrc and configFile to ensure consistent settings
 * 
 * The transformer ensures that tests use the same Babel configuration
 * as the webpack build process.
 */
module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: hasJsxRuntime ? 'automatic' : 'classic',
      },
    ],
  ],
  babelrc: false,      // Ignore .babelrc files
  configFile: false,   // Ignore babel.config.js files
});