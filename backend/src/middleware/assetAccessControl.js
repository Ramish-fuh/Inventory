import logger from '../utils/logger.js';
import Asset from '../models/Asset.js';

export const assetAccessControl = async (req, res, next) => {
  try {
    const { role } = req.user;
    const method = req.method;
    const assetId = req.params.id;

    logger.info('Asset access control check:', {
      userId: req.user._id,
      role,
      method,
      assetId,
      path: req.path,
      query: req.query
    });

    // Admins have full access
    if (role === 'Admin') {
      logger.info('Admin access granted', { userId: req.user._id });
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
            role,
            assignedTo: asset.assignedTo
          });
          return res.status(403).json({ message: 'Not authorized to view this asset' });
        }
      }
      // Technicians can view any asset
      else if (role === 'Technician') {
        logger.info('Technician viewing asset details', {
          userId: req.user._id,
          assetId,
          role
        });
      }
      return next();
    }

    // For GET requests on asset list
    if (method === 'GET') {
      // Regular users can only see their assigned assets
      if (role === 'User') {
        logger.info('Filtering assets for user', {
          userId: req.user._id,
          currentQuery: req.query
        });
        req.query.assignedTo = req.user._id;
      } else if (role === 'Technician') {
        // Technicians can see all assets
        logger.info('Technician accessing all assets', {
          userId: req.user._id,
          currentQuery: req.query
        });
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
      
      // Only Admins and Technicians can update other properties
      if (role === 'Technician') {
        return next();
      }

      // Regular users cannot update assets
      logger.warn('Non-technician attempting to update asset', {
        userId: req.user._id,
        role,
        assetId
      });
      return res.status(403).json({ message: 'Not authorized to update assets' });
    }

    // For POST/DELETE requests
    if (method === 'DELETE') {
      // Only admins can delete assets
      logger.warn('Non-admin attempting to delete asset', {
        userId: req.user._id,
        role,
        assetId
      });
      return res.status(403).json({ message: 'Only administrators can delete assets' });
    } else if (method === 'POST') {
      // Only admins can create assets
      logger.warn('Non-admin attempting to create asset', {
        userId: req.user._id,
        method,
        role
      });
      return res.status(403).json({ message: 'Only administrators can create new assets' });
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