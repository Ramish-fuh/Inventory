import mongoose from 'mongoose';
import Log from '../models/Log.js';
import Asset from '../models/Asset.js';
import logger from '../utils/logger.js';

// @desc    Get all assets
// @route   GET /api/assets
// @access  Public
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (error) {
    logger.error('🔥 Error fetching assets:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Public
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (error) {
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
      target: deletedAsset._id,
      details: `Asset ${deletedAsset.name} deleted.`
    });

    res.json({ message: 'Asset removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};