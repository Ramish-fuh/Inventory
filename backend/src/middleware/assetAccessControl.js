import logger from '../utils/logger.js';
import Asset from '../models/Asset.js';

export const assetAccessControl = async (req, res, next) => {
  try {
    const { role } = req.user;
    const method = req.method;
    const assetId = req.params.id;

    // Admins have full access
    if (role === 'Admin') {
      return next();
    }

    // For GET requests on specific assets
    if (method === 'GET' && assetId) {
      const asset = await Asset.findById(assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      // Regular users can only view their assigned assets
      if (role === 'User') {
        if (asset.assignedTo?.toString() !== req.user._id.toString()) {
          logger.warn('Unauthorized asset access attempt', {
            userId: req.user._id,
            assetId,
            role
          });
          return res.status(403).json({ message: 'Not authorized to view this asset' });
        }
      }
      return next();
    }

    // For GET requests on asset list
    if (method === 'GET') {
      // Regular users can only see their assigned assets
      if (role === 'User') {
        req.query.assignedTo = req.user._id;
      }
      return next();
    }

    // For PUT requests (updates)
    if (method === 'PUT') {
      // Check if the update includes assignment changes or status change to 'In Use'
      if (req.body.hasOwnProperty('assignedTo') || req.body.status === 'In Use') {
        logger.warn('Non-admin attempting to assign asset or change status to In Use', {
          userId: req.user._id,
          role,
          assetId,
          attemptedChange: req.body
        });
        return res.status(403).json({ message: 'Only administrators can assign assets or set status to In Use' });
      }
      
      // Only Technicians can update other properties
      if (role === 'Technician') {
        return next();
      }

      // Regular users cannot update assets
      return res.status(403).json({ message: 'Not authorized to update assets' });
    }

    // For POST/DELETE requests
    if ((method === 'POST' || method === 'DELETE') && role !== 'Admin') {
      logger.warn('Unauthorized asset operation attempt', {
        userId: req.user._id,
        method,
        role
      });
      return res.status(403).json({ message: 'Not authorized to perform this operation' });
    }

    next();
  } catch (error) {
    logger.error('Error in asset access control', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    res.status(500).json({ message: 'Error checking asset permissions' });
  }
};