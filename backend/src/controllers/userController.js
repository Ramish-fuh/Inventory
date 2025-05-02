import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Log from '../models/Log.js';
import SystemLog from '../models/SystemLog.js';
import logger from '../utils/logger.js';

// Create a new user
export const createUser = async (req, res) => {
  try {
    logger.info('User creation attempt', { body: req.body });

    const { username, email, fullName, role, password, department = 'IT' } = req.body;

    // Validate required fields
    if (!username || !email || !fullName || !role || !password) {
      logger.warn('Missing required fields', {
        providedFields: Object.keys(req.body),
        username: !!username,
        email: !!email,
        fullName: !!fullName,
        role: !!role,
        password: !!password
      });
      return res.status(400).json({ 
        message: 'Missing required fields. Username, email, fullName, role, and password are required.',
        missingFields: Object.entries({ username, email, fullName, role, password })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    logger.info('Creating new user', {
      requesterId: req.user?._id,
      username,
      role
    });

    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn('User creation failed - user already exists', {
        requesterId: req.user._id,
        username,
        email
      });

      await SystemLog.create({
        level: 'warn',
        message: 'User creation attempt with existing username/email',
        service: 'user-service',
        metadata: {
          requesterId: req.user._id,
          username,
          email
        },
        user: req.user._id
      });

      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user with all required fields
    user = new User({
      username,
      email,
      fullName,
      role,
      department,
      passwordHash,
      isActive: true
    });

    logger.info('Attempting to save new user', { 
      username,
      email,
      role,
      department
    });

    await user.save();

    // Log the user creation action
    await Log.create({
      user: req.user.id,
      action: 'User Created',
      category: 'User Management',
      details: `Created user with ID ${user._id}`,
    });

    await SystemLog.create({
      level: 'info',
      message: 'New user created',
      service: 'user-service',
      metadata: {
        requesterId: req.user._id,
        newUserId: user._id,
        username,
        role
      },
      user: req.user._id
    });

    logger.info('User created successfully', {
      requesterId: req.user._id,
      newUserId: user._id,
      username,
      role
    });

    // Remove password hash from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    // Send more descriptive error message
    res.status(500).json({ 
      message: 'Error creating user',
      details: error.message,
      validation: error.errors
    });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    logger.info('Fetching all users', {
      requesterId: req.user._id,
      requesterRole: req.user.role
    });

    // Only allow admins to get user list
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select('-passwordHash');

    await SystemLog.create({
      level: 'info',
      message: 'Users list fetched',
      service: 'user-service',
      metadata: {
        requesterId: req.user._id,
        userCount: users.length
      },
      user: req.user._id
    });

    logger.info('Users fetched successfully', {
      count: users.length,
      requesterId: req.user._id
    });

    res.json(users);
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update a user by ID
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    logger.info('Updating user', {
      requesterId: req.user._id,
      targetUserId: id,
      updateFields: Object.keys(updateData)
    });

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { username, email, fullName, role, password } = req.body;
    const userId = req.params.id;

    let user = await User.findById(userId);
    if (!user) {
      logger.warn('Update failed - user not found', {
        requesterId: req.user._id,
        targetUserId: id
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Attempt to update non-existent user',
        service: 'user-service',
        metadata: {
          requesterId: req.user._id,
          targetUserId: id
        },
        user: req.user._id
      });

      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username/email is being changed and if it's already taken
    if (username !== user.username || email !== user.email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [{ username }, { email }] }
        ]
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already taken' });
      }
    }

    // Update user fields
    user.username = username;
    user.email = email;
    user.fullName = fullName;
    user.role = role;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Log the user update action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'Update User',
      category: 'User Management',
      target: user._id,
      details: `User ${user.username} updated.`
    });

    await SystemLog.create({
      level: 'info',
      message: 'User updated',
      service: 'user-service',
      metadata: {
        requesterId: req.user._id,
        targetUserId: id,
        updatedFields: Object.keys(updateData)
      },
      user: req.user._id
    });

    logger.info('User updated successfully', {
      requesterId: req.user._id,
      targetUserId: id,
      username: user.username
    });

    // Remove password hash from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.json(userResponse);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete a user by ID
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Deleting user', {
      requesterId: req.user._id,
      targetUserId: id
    });

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      logger.warn('Deletion failed - user not found', {
        requesterId: req.user._id,
        targetUserId: id
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Attempt to delete non-existent user',
        service: 'user-service',
        metadata: {
          requesterId: req.user._id,
          targetUserId: id
        },
        user: req.user._id
      });

      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await user.deleteOne();

    // Log the user deletion action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'Delete User',
      category: 'User Management',
      target: user._id,
      details: `User ${user.username} deleted.`
    });

    await SystemLog.create({
      level: 'info',
      message: 'User deleted',
      service: 'user-service',
      metadata: {
        requesterId: req.user._id,
        deletedUserId: id,
        deletedUsername: user.username
      },
      user: req.user._id
    });

    logger.info('User deleted successfully', {
      requesterId: req.user._id,
      deletedUserId: id,
      username: user.username
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Search users for autocomplete
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    }).select('username fullName email'); // Only return necessary fields

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};