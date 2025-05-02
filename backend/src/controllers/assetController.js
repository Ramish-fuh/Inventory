import mongoose from 'mongoose';
import Log from '../models/Log.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { generateQRCodeBuffer } from '../utils/genQr.js';
import { generatePDFReport, generateExcelReport } from '../utils/reportGenerator.js';
import SystemLog from '../models/SystemLog.js';
import { createNotification } from '../helpers/notificationHelper.js';

// Get all assets with filtering and search
export const getAssets = async (req, res) => {
  try {
    logger.info('Fetching all assets', { 
      userId: req.user?._id,
      query: req.query 
    });

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

    logger.info('Assets fetched successfully', {
      count: assets.length,
      userId: req.user?._id
    });

    res.json(assets);
  } catch (error) {
    logger.error('Error fetching assets', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });

    await SystemLog.create({
      level: 'error',
      message: `Failed to fetch assets: ${error.message}`,
      service: 'asset-service',
      trace: error.stack,
      user: req.user?._id
    });

    res.status(500).json({ message: 'Error getting assets' });
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Public
export const getAssetById = async (req, res) => {
  try {
    logger.info('Fetching asset by ID', { 
      assetId: req.params.id,
      userId: req.user?._id 
    });

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

    logger.info('Asset fetched successfully', {
      assetId: asset._id,
      assetName: asset.name,
      userId: req.user?._id
    });

    res.json(asset);
  } catch (error) {
    logger.error('Error fetching asset by ID', {
      error: error.message,
      stack: error.stack,
      assetId: req.params.id,
      userId: req.user?._id
    });

    await SystemLog.create({
      level: 'error',
      message: `Failed to fetch asset: ${error.message}`,
      service: 'asset-service',
      metadata: { assetId: req.params.id },
      trace: error.stack,
      user: req.user?._id
    });

    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Public
export const createAsset = async (req, res) => {
  try {
    logger.info('Creating new asset', {
      requesterId: req.user._id,
      assetData: req.body
    });

    const asset = new Asset(req.body);
    await asset.save();

    // Create activity log
    await Log.create({
      user: req.user._id,
      action: 'Create Asset',
      category: 'Asset Management',
      target: asset._id,
      details: `Asset ${asset.name} (${asset.assetTag}) created`
    });

    // Log to system logs
    await SystemLog.create({
      level: 'info',
      message: 'New asset created',
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        assetId: asset._id,
        assetTag: asset.assetTag,
        category: asset.category
      },
      user: req.user._id
    });

    // Notify admins about new asset
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification(
        admin,
        'asset',
        `New asset ${asset.name} (${asset.assetTag}) has been created`,
        { assetId: asset._id }
      );
    }

    logger.info('Asset created successfully', {
      requesterId: req.user._id,
      assetId: asset._id,
      assetTag: asset.assetTag
    });

    res.status(201).json(asset);
  } catch (error) {
    logger.error('Error creating asset', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id,
      assetData: req.body
    });

    await SystemLog.create({
      level: 'error',
      message: `Error creating asset: ${error.message}`,
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        attemptedAsset: req.body
      },
      trace: error.stack,
      user: req.user._id
    });

    res.status(500).json({ message: 'Error creating asset' });
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Public
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Updating asset', {
      requesterId: req.user._id,
      assetId: id,
      updateData: req.body
    });

    const asset = await Asset.findById(id);
    if (!asset) {
      logger.warn('Update failed - asset not found', {
        requesterId: req.user._id,
        assetId: id
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Attempt to update non-existent asset',
        service: 'asset-service',
        metadata: {
          requesterId: req.user._id,
          assetId: id
        },
        user: req.user._id
      });

      return res.status(404).json({ message: 'Asset not found' });
    }

    // Track changes for logging
    const changes = [];
    Object.keys(req.body).forEach(key => {
      if (asset[key] !== req.body[key]) {
        changes.push({
          field: key,
          oldValue: asset[key],
          newValue: req.body[key]
        });
      }
    });

    // Update the asset
    Object.assign(asset, req.body);
    await asset.save();

    // Create activity log with detailed changes
    await Log.create({
      user: req.user._id,
      action: 'Update Asset',
      category: 'Asset Management',
      target: asset._id,
      details: `Asset ${asset.name} (${asset.assetTag}) updated. Changes: ${JSON.stringify(changes)}`
    });

    await SystemLog.create({
      level: 'info',
      message: 'Asset updated',
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        assetId: id,
        changes
      },
      user: req.user._id
    });

    // Notify relevant users about the update
    if (asset.assignedTo) {
      await createNotification(
        asset.assignedTo,
        'asset',
        `Asset ${asset.name} assigned to you has been updated`,
        { assetId: asset._id }
      );
    }

    logger.info('Asset updated successfully', {
      requesterId: req.user._id,
      assetId: id,
      changes
    });

    res.json(asset);
  } catch (error) {
    logger.error('Error updating asset', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id,
      assetId: req.params.id
    });

    await SystemLog.create({
      level: 'error',
      message: `Error updating asset: ${error.message}`,
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        assetId: req.params.id,
        attemptedUpdate: req.body
      },
      trace: error.stack,
      user: req.user._id
    });

    res.status(500).json({ message: 'Error updating asset' });
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Public
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Deleting asset', {
      requesterId: req.user._id,
      assetId: id
    });

    const asset = await Asset.findById(id);
    if (!asset) {
      logger.warn('Deletion failed - asset not found', {
        requesterId: req.user._id,
        assetId: id
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Attempt to delete non-existent asset',
        service: 'asset-service',
        metadata: {
          requesterId: req.user._id,
          assetId: id
        },
        user: req.user._id
      });

      return res.status(404).json({ message: 'Asset not found' });
    }

    await asset.deleteOne();

    // Log the deletion
    await Log.create({
      user: req.user._id,
      action: 'Delete Asset',
      category: 'Asset Management',
      target: id,
      details: `Asset ${asset.name} (${asset.assetTag}) deleted`
    });

    await SystemLog.create({
      level: 'info',
      message: 'Asset deleted',
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        deletedAssetId: id,
        assetTag: asset.assetTag,
        assetName: asset.name
      },
      user: req.user._id
    });

    // Notify relevant users about the deletion
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification(
        admin,
        'asset',
        `Asset ${asset.name} (${asset.assetTag}) has been deleted`,
        { assetId: id }
      );
    }

    logger.info('Asset deleted successfully', {
      requesterId: req.user._id,
      assetId: id,
      assetTag: asset.assetTag
    });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    logger.error('Error deleting asset', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id,
      assetId: req.params.id
    });

    await SystemLog.create({
      level: 'error',
      message: `Error deleting asset: ${error.message}`,
      service: 'asset-service',
      metadata: {
        requesterId: req.user._id,
        assetId: req.params.id
      },
      trace: error.stack,
      user: req.user._id
    });

    res.status(500).json({ message: 'Error deleting asset' });
  }
};

// @desc    Export assets to PDF
// @route   GET /api/assets/export/pdf
// @access  Private
export const exportToPDF = async (req, res) => {
  try {
    const assets = await Asset.find({});
    const buffer = await generatePDFReport(assets);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=asset-inventory.pdf');
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

// @desc    Export assets to Excel
// @route   GET /api/assets/export/excel
// @access  Private
export const exportToExcel = async (req, res) => {
  try {
    const assets = await Asset.find({});
    const buffer = await generateExcelReport(assets);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=asset-inventory.xlsx');
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating Excel:', error);
    res.status(500).json({ message: 'Error generating Excel report' });
  }
};