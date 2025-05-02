import mongoose from 'mongoose';
import Log from '../models/Log.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { generateQRCodeBuffer } from '../utils/genQr.js';

// Get all assets with filtering and search
export const getAssets = async (req, res) => {
  try {
    const { search, category, status, assignedTo } = req.query;
    const query = {};

    // Search by name, description, or serial number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by assigned user
    if (assignedTo) {
      // First find the user by name or username
      const user = await User.findOne({
        $or: [
          { username: { $regex: assignedTo, $options: 'i' } },
          { fullName: { $regex: assignedTo, $options: 'i' } }
        ]
      });

      if (user) {
        query.assignedTo = user._id;
      } else {
        // If no user found, return empty results
        return res.json([]);
      }
    }

    const assets = await Asset.find(query)
      .populate('assignedTo', 'username fullName email')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    logger.error('Error getting assets:', error);
    res.status(500).json({ message: 'Error getting assets' });
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Public
export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if id is provided and is a valid ObjectId
    if (!id || id === 'undefined') {
      logger.error('Invalid asset ID provided:', id);
      return res.status(400).json({ message: 'Invalid asset ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid asset ID format' });
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      logger.warn('Asset not found for ID:', id);
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Only create log if we have a user in the request
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'Asset Fetched',
        category: 'Asset Management',
        details: `Fetched asset with ID ${id}`,
      });
    }

    res.json(asset);
  } catch (error) {
    logger.error('Error getting asset by ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Public
export const createAsset = async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const savedAsset = await asset.save();

    // Log the asset creation action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'Create Asset',
      category: 'Asset Management',
      target: savedAsset._id,
      details: `Asset ${savedAsset.name} created.`
    });

    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Public
export const updateAsset = async (req, res) => {
  try {
    const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAsset) return res.status(404).json({ message: 'Asset not found' });

    // Log the asset update action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'Update Asset',
      category: 'Asset Management',
      target: updatedAsset._id,
      details: `Asset ${updatedAsset.name} updated.`
    });

    res.json(updatedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Public
export const deleteAsset = async (req, res) => {
  try {
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    if (!deletedAsset) return res.status(404).json({ message: 'Asset not found' });

    // Log the asset deletion action
    await Log.create({
      user: req.user.id, // Assuming `req.user` contains the logged-in user
      action: 'Delete Asset',
      category: 'Asset Management',
      target: deletedAsset._id,
      details: `Asset ${deletedAsset.name} deleted.`
    });

    res.json({ message: 'Asset removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};