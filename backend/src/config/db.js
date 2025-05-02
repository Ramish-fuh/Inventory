import { connect } from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI || 'mongodb://localhost:27017/asset-manager');
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;