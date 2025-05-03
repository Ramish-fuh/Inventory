import express from 'express';
import { 
  getAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset,
  exportToPDF,
  exportToExcel 
} from '../controllers/assetController.js';
import { assetAccessControl } from '../middleware/assetAccessControl.js';

const router = express.Router();

// Apply asset access control to all routes
router.use(assetAccessControl);

// GET all assets
router.get('/', getAssets);

// Export routes
router.get('/export/pdf', exportToPDF);
router.get('/export/excel', exportToExcel);

// GET single asset by ID
router.get('/:id', getAssetById);

// POST create new asset
router.post('/', createAsset);

// PUT update asset by ID
router.put('/:id', updateAsset);

// DELETE asset by ID
router.delete('/:id', deleteAsset);

export default router;
