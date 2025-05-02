import express from 'express';
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../controllers/assetController.js';

const router = express.Router();

// GET all assets
router.get('/', getAssets); // Use controller function

// GET single asset by ID
router.get('/:id', getAssetById); // Use controller function

// POST create new asset
router.post('/', createAsset); // Use controller function

// PUT update asset by ID
router.put('/:id', updateAsset); // Use controller function

// DELETE asset by ID
router.delete('/:id', deleteAsset); // Use controller function

export default router;
