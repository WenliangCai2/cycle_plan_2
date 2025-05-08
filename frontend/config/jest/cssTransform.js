/**
 * CSS Transform for Jest
 * =======================
 * This module provides a custom Jest transformer that converts CSS imports
 * into empty objects to prevent test failures from style imports.
 * 
 * Features:
 * - Style import handling for Jest tests
 * - Empty object transformation for CSS files
 * - Consistent cache key generation
 * - Compatible with Jest's module system
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

/**
 * Custom Jest transformer for CSS files
 * 
 * This transformer converts CSS imports to empty objects during testing.
 * Without this transformer, importing CSS files in components would cause
 * Jest tests to fail since Jest doesn't natively understand CSS.
 * 
 * See Jest documentation: http://facebook.github.io/jest/docs/en/webpack.html
 */
module.exports = {
  /**
   * Transform CSS imports into empty JavaScript objects
   * 
   * Process:
   * 1. Ignores the actual content of CSS files
   * 2. Returns a module.exports statement with an empty object
   * 
   * Args:
   *   src (String): Source content (not used)
   *   filename (String): Filename of the CSS file (not used)
   * 
   * Returns:
   *   String: JavaScript code exporting an empty object
   */
  process() {
    return 'module.exports = {};';
  },
  
  /**
   * Generate a consistent cache key for the transformer
   * 
   * Process:
   * 1. Returns a static string since the transformation is deterministic
   * 
   * Returns:
   *   String: Cache key for the transformer
   */
  getCacheKey() {
    // The output is always the same.
    return 'cssTransform';
  },
};