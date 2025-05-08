/**
 * Test Runner Script
 * =======================
 * This script executes tests for the React application using Jest.
 * 
 * Features:
 * - Environment configuration for testing
 * - Jest test runner setup
 * - Watch mode configuration based on environment
 * - Version control system detection
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */
'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const jest = require('jest');
const execSync = require('child_process').execSync;
let argv = process.argv.slice(2);

/**
 * Check if the current directory is in a Git repository.
 * 
 * Process:
 * 1. Executes git command to check repository status
 * 2. Returns boolean based on command success
 * 
 * Returns:
 *   Boolean: True if in Git repository, false otherwise
 */
function isInGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current directory is in a Mercurial repository.
 * 
 * Process:
 * 1. Executes hg command to check repository status
 * 2. Returns boolean based on command success
 * 
 * Returns:
 *   Boolean: True if in Mercurial repository, false otherwise
 */
function isInMercurialRepository() {
  try {
    execSync('hg --cwd . root', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Watch unless on CI or explicitly running all tests
if (
  !process.env.CI &&
  argv.indexOf('--watchAll') === -1 &&
  argv.indexOf('--watchAll=false') === -1
) {
  // https://github.com/facebook/create-react-app/issues/5210
  const hasSourceControl = isInGitRepository() || isInMercurialRepository();
  argv.push(hasSourceControl ? '--watch' : '--watchAll');
}


jest.run(argv);