/**
 * Environment Configuration Module
 * =======================
 * This module handles environment variable configuration for webpack,
 * including loading from .env files and preparing them for injection.
 * 
 * Features:
 * - Environment variable loading from .env files
 * - Variable priority management
 * - Dotenv expansion support
 * - NODE_PATH resolution
 * - Environment variable filtering for webpack
 * - JSON stringification for webpack DefinePlugin
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

// Clear cache for paths module to ensure fresh environment variables
delete require.cache[require.resolve('./paths')];

// Verify NODE_ENV is defined, required for proper operation
const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  );
}

/**
 * Priority order of dotenv files to load (first one found is used)
 * 
 * 1. .env.{NODE_ENV}.local - Local overrides of environment-specific settings
 * 2. .env.local - Local overrides (skipped for test environment for consistency)
 * 3. .env.{NODE_ENV} - Environment-specific settings
 * 4. .env - Default settings
 */
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${paths.dotenv}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  paths.dotenv,
].filter(Boolean);

/**
 * Load environment variables from .env* files
 * 
 * Process:
 * 1. Checks if each dotenv file exists
 * 2. Loads environment variables from each existing file
 * 3. Expands variables using dotenv-expand
 * 4. Skips already defined variables (does not override)
 */
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile,
      })
    );
  }
});

/**
 * Configure NODE_PATH for webpack module resolution
 * 
 * Process:
 * 1. Gets the application directory
 * 2. Processes NODE_PATH from environment or defaults to empty
 * 3. Filters only relative paths for security
 * 4. Resolves paths relative to application directory
 * 5. Joins with appropriate delimiter
 */
const appDirectory = fs.realpathSync(process.cwd());
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter);

// Regular expression to filter React App specific environment variables
const REACT_APP = /^REACT_APP_/i;

/**
 * Create webpack-compatible environment configuration
 * 
 * Process:
 * 1. Filters environment variables that start with REACT_APP_
 * 2. Adds required webpack environment variables
 * 3. Produces raw and stringified versions
 * 4. Formats for use with webpack's DefinePlugin
 * 
 * Args:
 *   publicUrl (String): URL path to public assets
 * 
 * Returns:
 *   Object with raw and stringified environment variables
 */
function getClientEnvironment(publicUrl) {
  // Prepare raw environment variable object
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // Useful for determining whether we're running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: publicUrl,
        // We support configuring the sockjs pathname during development.
        // These settings let a developer run multiple simultaneous projects.
        // They are used as the connection `hostname`, `pathname` and `port`
        // in webpackHotDevClient. They are used as the `sockHost`, `sockPath`
        // and `sockPort` options in webpack-dev-server.
        WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
        WDS_SOCKET_PATH: process.env.WDS_SOCKET_PATH,
        WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT,
        // Whether or not react-refresh is enabled.
        // It is defined here so it is available in the webpackHotDevClient.
        FAST_REFRESH: process.env.FAST_REFRESH !== 'false',
      }
    );
  
  // Stringify all values for webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;