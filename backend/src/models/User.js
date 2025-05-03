import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SystemLog from './SystemLog.js';
import logger from '../utils/logger.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'User', 'Technician', 'Viewer'],
    default: 'User'
  },
  department: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Pre-save hook for password hashing and logging
userSchema.pre('save', async function(next) {
  const user = this;
  const startTime = Date.now();

  try {
    logger.info('Attempting to save user', {
      userId: user._id,
      isNew: user.isNew,
      modifiedPaths: user.modifiedPaths()
    });

    // No need to hash here since it's handled in the controller
    const duration = Date.now() - startTime;
    logger.info('User pre-save hook completed', {
      userId: user._id,
      duration
    });

    next();
  } catch (error) {
    logger.error('Error in user pre-save hook', {
      error: error.message,
      stack: error.stack,
      userId: user._id
    });

    await SystemLog.create({
      level: 'error',
      message: 'Error in user pre-save hook',
      service: 'user-model',
      metadata: {
        userId: user._id,
        error: error.message
      },
      trace: error.stack
    });

    next(error);
  }
});

// Post-save hook for logging
userSchema.post('save', async function(doc, next) {
  try {
    const duration = Date.now() - (this._startTime || Date.now());
    logger.info('User saved successfully', {
      userId: doc._id,
      isNew: doc.isNew,
      duration
    });

    await SystemLog.create({
      level: 'info',
      message: doc.isNew ? 'New user created' : 'User updated',
      service: 'user-model',
      metadata: {
        userId: doc._id,
        duration
      }
    });

    next();
  } catch (error) {
    logger.error('Error in user post-save hook', {
      error: error.message,
      stack: error.stack,
      userId: doc._id
    });
    next();
  }
});

// Log user updates
userSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    const userId = this.getQuery()._id;

    logger.info('Updating user', {
      userId,
      updates: update
    });

    await SystemLog.create({
      level: 'info',
      message: 'User account updated',
      service: 'user-model',
      metadata: {
        userId,
        updates: update
      }
    });

    next();
  } catch (error) {
    logger.error('Error in user pre-update hook', {
      error: error.message,
      stack: error.stack
    });

    await SystemLog.create({
      level: 'error',
      message: 'Error in user pre-update hook',
      service: 'user-model',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });

    next(error);
  }
});

// Pre-remove hook for logging
userSchema.pre('remove', async function(next) {
  const user = this;
  const startTime = Date.now();

  try {
    logger.info('Attempting to remove user', {
      userId: user._id
    });

    await SystemLog.create({
      level: 'warn',
      message: 'User deletion initiated',
      service: 'user-model',
      metadata: {
        userId: user._id,
        username: user.username,
        email: user.email
      }
    });

    next();
  } catch (error) {
    logger.error('Error in user pre-remove hook', {
      error: error.message,
      stack: error.stack,
      userId: user._id
    });
    next(error);
  }
});

// Post-remove hook for logging
userSchema.post('remove', async function(doc, next) {
  try {
    logger.info('User removed successfully', {
      userId: doc._id
    });

    await SystemLog.create({
      level: 'info',
      message: 'User deleted',
      service: 'user-model',
      metadata: {
        userId: doc._id,
        username: doc.username,
        email: doc.email
      }
    });

    next();
  } catch (error) {
    logger.error('Error in user post-remove hook', {
      error: error.message,
      stack: error.stack,
      userId: doc._id
    });
    next();
  }
});

// Password comparison method with logging
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    logger.error('Error comparing passwords', {
      error: error.message,
      stack: error.stack,
      userId: this._id
    });
    throw error;
  }
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  try {
    this.lastLogin = new Date();
    await this.save();

    logger.info('Updated user last login', {
      userId: this._id,
      username: this.username,
      lastLogin: this.lastLogin
    });

    await SystemLog.create({
      level: 'info',
      message: 'User login recorded',
      service: 'user-model',
      metadata: {
        userId: this._id,
        username: this.username,
        lastLogin: this.lastLogin
      }
    });
  } catch (error) {
    logger.error('Error updating last login', {
      error: error.message,
      stack: error.stack,
      userId: this._id
    });

    await SystemLog.create({
      level: 'error',
      message: 'Error updating last login',
      service: 'user-model',
      metadata: {
        userId: this._id,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

const User = mongoose.model('User', userSchema);
export default User;