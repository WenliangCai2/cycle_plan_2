/**
 * HTTPS Configuration Module
 * =======================
 * This module provides HTTPS configuration for the development server,
 * handling SSL certificate validation and loading.
 * 
 * Features:
 * - HTTPS configuration based on environment variables
 * - SSL certificate and key validation
 * - Error handling with descriptive messages
 * - File path resolution for certificates
 * - Support for custom certificates
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('react-dev-utils/chalk');
const paths = require('./paths');

/**
 * Validate SSL key and certificate
 * 
 * Process:
 * 1. Tests certificate validity using crypto.publicEncrypt
 * 2. Tests key validity using crypto.privateDecrypt
 * 3. Throws descriptive errors if validation fails
 * 
 * Args:
 *   cert (Buffer): SSL certificate content
 *   key (Buffer): SSL key content
 *   keyFile (String): Path to key file for error reporting
 *   crtFile (String): Path to certificate file for error reporting
 * 
 * Throws:
 *   Error: If certificate or key is invalid
 */
function validateKeyAndCerts({ cert, key, keyFile, crtFile }) {
  let encrypted;
  try {
    // publicEncrypt will throw an error with an invalid cert
    encrypted = crypto.publicEncrypt(cert, Buffer.from('test'));
  } catch (err) {
    throw new Error(
      `The certificate "${chalk.yellow(crtFile)}" is invalid.\n${err.message}`
    );
  }

  try {
    // privateDecrypt will throw an error with an invalid key
    crypto.privateDecrypt(key, encrypted);
  } catch (err) {
    throw new Error(
      `The certificate key "${chalk.yellow(keyFile)}" is invalid.\n${
        err.message
      }`
    );
  }
}

/**
 * Read file content and handle missing files
 * 
 * Process:
 * 1. Checks if file exists
 * 2. Throws descriptive error if file is missing
 * 3. Reads and returns file content
 * 
 * Args:
 *   file (String): Path to file
 *   type (String): Type of file for error messages
 * 
 * Returns:
 *   Buffer: File content
 * 
 * Throws:
 *   Error: If file does not exist
 */
function readEnvFile(file, type) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `You specified ${chalk.cyan(
        type
      )} in your env, but the file "${chalk.yellow(file)}" can't be found.`
    );
  }
  return fs.readFileSync(file);
}

/**
 * Generate HTTPS configuration for development server
 * 
 * Process:
 * 1. Reads SSL_CRT_FILE, SSL_KEY_FILE, and HTTPS environment variables
 * 2. If HTTPS is enabled and both cert and key files are specified:
 *    a. Resolves file paths
 *    b. Reads file contents
 *    c. Validates certificate and key
 *    d. Returns configuration object
 * 3. Otherwise returns boolean HTTPS flag
 * 
 * Returns:
 *   Object|Boolean: HTTPS configuration object or boolean flag
 */
function getHttpsConfig() {
  const { SSL_CRT_FILE, SSL_KEY_FILE, HTTPS } = process.env;
  const isHttps = HTTPS === 'true';

  if (isHttps && SSL_CRT_FILE && SSL_KEY_FILE) {
    // Resolve file paths
    const crtFile = path.resolve(paths.appPath, SSL_CRT_FILE);
    const keyFile = path.resolve(paths.appPath, SSL_KEY_FILE);
    
    // Read certificate and key files
    const config = {
      cert: readEnvFile(crtFile, 'SSL_CRT_FILE'),
      key: readEnvFile(keyFile, 'SSL_KEY_FILE'),
    };

    // Validate certificate and key
    validateKeyAndCerts({ ...config, keyFile, crtFile });
    return config;
  }
  
  // Return boolean flag if no specific configuration
  return isHttps;
}

module.exports = getHttpsConfig;