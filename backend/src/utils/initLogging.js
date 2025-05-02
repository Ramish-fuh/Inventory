import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const LOG_DIRS = [
  'logs',
  'logs/audit',
  'logs/error',
  'logs/info'
];

export const initLogging = () => {
  try {
    // Create log directories if they don't exist
    LOG_DIRS.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Create empty log files if they don't exist
    const logFiles = [
      'logs/app.log',
      'logs/error.log',
      'logs/audit.log'
    ];

    logFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }
    });

    logger.info('Logging system initialized successfully', {
      directories: LOG_DIRS,
      files: logFiles
    });
  } catch (error) {
    console.error('Failed to initialize logging system:', error);
    process.exit(1);
  }
};