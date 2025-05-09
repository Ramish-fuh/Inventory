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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    
    // Add search criteria
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Add assignedTo filter for non-admin users
    if (req.user.role !== 'Admin' && req.query.assignedTo) {
      query.assignedTo = new mongoose.Types.ObjectId(req.query.assignedTo);
    }

    // Add category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    logger.info('Asset query constructed:', {
      userId: req.user._id,
      role: req.user.role,
      query: JSON.stringify(query)
    });

    const totalAssets = await Asset.countDocuments(query);
    const totalPages = Math.ceil(totalAssets / limit);

    const assets = await Asset.find(query)
      .populate('assignedTo', 'username fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    res.json({
      assets,
      currentPage: page,
      totalPages,
      totalItems: totalAssets,
      itemsPerPage: limit
    });
  } catch (error) {
    logger.error('Error in getAssets:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    res.status(500).json({ message: 'Error fetching assets' });
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

    // Validate required fields
    const { name, assetTag, category, status, location } = req.body;
    const validationErrors = {};

    if (!name?.trim()) validationErrors.name = 'Name is required';
    if (!assetTag?.trim()) validationErrors.assetTag = 'Asset tag is required';
    if (!category) validationErrors.category = 'Category is required';
    if (!status) validationErrors.status = 'Status is required';
    if (!location?.trim()) validationErrors.location = 'Location is required';

    // Status-specific validation
    if (status === 'In Use' && !req.body.assignedTo) {
      validationErrors.assignedTo = 'Asset must be assigned to a user when status is In Use';
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Clean up date fields
    const dateFields = ['purchaseDate', 'warrantyExpiry', 'licenseExpiry', 'nextMaintenance', 'lastMaintenance'];
    dateFields.forEach(field => {
      if (req.body[field]) {
        const date = new Date(req.body[field]);
        if (!isNaN(date.getTime())) {
          req.body[field] = date;
        } else {
          req.body[field] = null;
        }
      }
    });

    // Validate maintenance interval
    if (req.body.maintenanceInterval) {
      const interval = Number(req.body.maintenanceInterval);
      if (isNaN(interval) || interval <= 0 || !Number.isInteger(interval)) {
        return res.status(400).json({
          message: 'Validation error',
          errors: {
            maintenanceInterval: 'Maintenance interval must be a positive whole number'
          }
        });
      }
    }

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

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});

      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors (e.g., assetTag uniqueness)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: 'Validation error',
        errors: {
          [field]: `This ${field} is already in use`
        }
      });
    }

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

    res.status(500).json({ 
      message: 'Error creating asset',
      error: error.message 
    });
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
      updateData: JSON.stringify(req.body, null, 2)
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const msg = 'Invalid asset ID format';
      logger.error(msg, { id });
      return res.status(400).json({ message: msg });
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      const msg = 'Asset not found';
      logger.warn('Update failed - asset not found', {
        requesterId: req.user._id,
        assetId: id
      });
      return res.status(404).json({ message: msg });
    }

    // Track changes for logging
    const changes = [];
    Object.keys(req.body).forEach(key => {
      if (JSON.stringify(asset[key]) !== JSON.stringify(req.body[key])) {
        changes.push({
          field: key,
          oldValue: asset[key],
          newValue: req.body[key]
        });
      }
    });

    // Handle status and assignedTo relationship
    if (req.body.status === 'In Use' && !req.body.assignedTo) {
      return res.status(400).json({
        message: 'Validation error',
        errors: {
          assignedTo: 'Asset must be assigned to a user when status is In Use'
        }
      });
    }

    // Capture old assignedTo for notification purposes
    const oldAssignedTo = asset.assignedTo;

    if (req.body.status && req.body.status !== 'In Use') {
      req.body.assignedTo = null;
    }

    // Update the asset
    try {
      const updatedAsset = await Asset.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('assignedTo');

      // Create activity log with detailed changes
      await Log.create({
        user: req.user._id,
        action: 'Update Asset',
        category: 'Asset Management',
        target: updatedAsset._id,
        details: `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) updated. Changes: ${JSON.stringify(changes)}`
      });

      // Notify previous owner if asset was unassigned
      if (oldAssignedTo && (!updatedAsset.assignedTo || oldAssignedTo.toString() !== updatedAsset.assignedTo._id.toString())) {
        await createNotification(
          oldAssignedTo,
          'asset',
          `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) has been unassigned from you`,
          { assetId: updatedAsset._id }
        );
      }

      // Notify new owner if asset was assigned
      if (updatedAsset.assignedTo && (!oldAssignedTo || oldAssignedTo.toString() !== updatedAsset.assignedTo._id.toString())) {
        await createNotification(
          updatedAsset.assignedTo._id,
          'asset',
          `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) has been assigned to you`,
          { assetId: updatedAsset._id }
        );
      }
      // Notify current owner about any other changes if the asset remains assigned to them
      else if (updatedAsset.assignedTo && changes.length > 0) {
        await createNotification(
          updatedAsset.assignedTo._id,
          'asset',
          `Your assigned asset ${updatedAsset.name} (${updatedAsset.assetTag}) has been updated`,
          { assetId: updatedAsset._id }
        );
      }

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

      logger.info('Asset updated successfully', {
        requesterId: req.user._id,
        assetId: id,
        changes
      });

      res.json(updatedAsset);
    } catch (validationError) {
      logger.error('Validation error updating asset', {
        error: validationError.message,
        errors: validationError.errors,
        requesterId: req.user._id,
        assetId: id,
        body: req.body
      });

      if (validationError.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: Object.keys(validationError.errors).reduce((acc, key) => {
            acc[key] = validationError.errors[key].message;
            return acc;
          }, {})
        });
      }
      throw validationError;
    }
  } catch (error) {
    logger.error('Error updating asset', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id,
      assetId: req.params.id,
      body: req.body
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

    res.status(500).json({ 
      message: 'Error updating asset',
      error: error.message
    });
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

// Test endpoint to check assigned assets
export const checkAssignedAssets = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const assets = await Asset.find({ assignedTo: userId })
      .populate('assignedTo', 'username fullName email');

    logger.info('Checking assigned assets', {
      userId,
      assetsFound: assets.length,
      assets: assets.map(a => ({
        id: a._id,
        name: a.name,
        status: a.status,
        assignedTo: a.assignedTo?._id
      }))
    });

    res.json({
      count: assets.length,
      assets: assets
    });
  } catch (error) {
    logger.error('Error checking assigned assets', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error checking assigned assets' });
  }
};

export const getAllAssets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { assetTag: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;

    const totalAssets = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('assignedTo', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      assets,
      currentPage: page,
      totalPages: Math.ceil(totalAssets / limit),
      totalItems: totalAssets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};