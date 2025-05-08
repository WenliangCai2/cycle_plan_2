/**
 * File Transform for Jest
 * =======================
 * This module provides a custom Jest transformer that converts file imports
 * into filenames, with special handling for SVG files to create React components.
 * 
 * Features:
 * - File import handling for Jest tests
 * - Filename transformation for most file types
 * - Special SVG handling to create React components
 * - Compatible with Jest's module system
 * - Integration with React for SVG rendering
 * 
 * Author: [Author Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

const path = require('path');
const camelcase = require('camelcase');

/**
 * Custom Jest transformer for file imports
 * 
 * This transformer handles file imports during testing, converting them
 * to appropriate module exports with special handling for SVG files.
 * 
 * See Jest documentation: http://facebook.github.io/jest/docs/en/webpack.html
 */
module.exports = {
  /**
   * Transform file imports into appropriate JavaScript modules
   * 
   * Process:
   * 1. Gets the basename of the file
   * 2. For SVG files:
   *    a. Creates a camelcased component name
   *    b. Implements a React component wrapping the SVG
   *    c. Returns both default export for filename and ReactComponent
   * 3. For other files:
   *    a. Returns a module exporting the filename
   * 
   * Args:
   *   src (String): Source content (not used)
   *   filename (String): Path of the file being imported
   * 
   * Returns:
   *   String: JavaScript code exporting the filename or SVG component
   */
  process(src, filename) {
    // Get just the filename portion and stringify for JS
    const assetFilename = JSON.stringify(path.basename(filename));

    // Special handling for SVG files
    if (filename.match(/\.svg$/)) {
      // Based on how SVGR generates a component name:
      // https://github.com/smooth-code/svgr/blob/01b194cf967347d43d4cbe6b434404731b87cf27/packages/core/src/state.js#L6
      const pascalCaseFilename = camelcase(path.parse(filename).name, {
        pascalCase: true,
      });
      const componentName = `Svg${pascalCaseFilename}`;
      
      // Create a React component that wraps the SVG
      return `const React = require('react');
      module.exports = {
        __esModule: true,
        default: ${assetFilename},
        ReactComponent: React.forwardRef(function ${componentName}(props, ref) {
          return {
            $$typeof: Symbol.for('react.element'),
            type: 'svg',
            ref: ref,
            key: null,
            props: Object.assign({}, props, {
              children: ${assetFilename}
            })
          };
        }),
      };`;
    }

    // For all other file types, simply export the filename
    return `module.exports = ${assetFilename};`;
  },
};