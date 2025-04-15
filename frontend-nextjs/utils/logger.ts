/**
 * Simple logging utility to replace toast notifications
 */

export const logSuccess = (message: string) => {
  console.log(`✅ SUCCESS: ${message}`);
};

export const logError = (message: string) => {
  console.error(`❌ ERROR: ${message}`);
};

export const logInfo = (message: string) => {
  console.info(`ℹ️ INFO: ${message}`);
};

export const logWarning = (message: string) => {
  console.warn(`⚠️ WARNING: ${message}`);
};
