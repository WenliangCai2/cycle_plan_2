/**
 * Web Vitals Reporting Utility
 * =======================
 * This module provides functionality for measuring and reporting key web performance metrics
 * to help monitor user experience quality.
 * 
 * Features:
 * - Dynamic import of web-vitals library
 * - Measurement of Core Web Vitals metrics
 * - Performance data collection and reporting
 * - Configurable callback for metric processing
 * 
 * Author: [Your Name]
 * Contributors: [Contributors Names]
 * Last Modified: [Date]
 */

/**
 * Reports Web Vitals metrics to a provided callback function
 * 
 * Process:
 * 1. Validates that the callback is a valid function
 * 2. Dynamically imports the web-vitals library
 * 3. Collects and measures the Core Web Vitals metrics:
 *    - Cumulative Layout Shift (CLS)
 *    - First Input Delay (FID)
 *    - First Contentful Paint (FCP)
 *    - Largest Contentful Paint (LCP)
 *    - Time to First Byte (TTFB)
 * 4. Passes each metric to the provided callback function
 * 
 * Args:
 *   onPerfEntry (Function): Callback function that processes the metrics
 * 
 * Examples:
 *   ```
 *   reportWebVitals(console.log);
 *   // Will log each metric to the console
 *   
 *   reportWebVitals((metric) => {
 *     sendToAnalytics(metric);
 *   });
 *   // Will send each metric to an analytics service
 *   ```
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;