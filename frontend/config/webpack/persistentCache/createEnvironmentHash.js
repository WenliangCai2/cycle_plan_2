/**
 * Environment Hash Generator
 * =======================
 * This module creates a hash of the environment variables for webpack cache invalidation.
 * 
 * Features:
 * - MD5 hash generation from environment variables
 * - Used for webpack's persistent cache feature
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';
const { createHash } = require('crypto');

/**
 * Generate a hash from environment variables.
 * 
 * Process:
 * 1. Creates MD5 hash instance
 * 2. Updates hash with stringified environment object
 * 3. Returns hexadecimal digest
 * 
 * Args:
 *   env (Object): Environment variables object
 *   
 * Returns:
 *   String: Hexadecimal MD5 hash
 */
module.exports = env => {
  const hash = createHash('md5');
  hash.update(JSON.stringify(env));

  return hash.digest('hex');
};