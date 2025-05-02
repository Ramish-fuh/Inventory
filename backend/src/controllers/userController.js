import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Log from '../models/Log.js';
import logger from '../utils/logger.js';

// Create a new user
export const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { username, email, fullName, role, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      fullName,
      role,
      passwordHash
    });

    await user.save();

    // Log the user creation action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'User Created',
      category: 'User Management',
      details: `Created user with ID ${user._id}`,
    });

    // Remove password hash from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    // Only allow admins to get user list
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select('-passwordHash');
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
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { username, email, fullName, role, password } = req.body;
    const userId = req.params.id;

    let user = await User.findById(userId);
    if (!user) {
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
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
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