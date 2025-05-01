const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true }, // e.g., INV-1001
  name: { type: String, required: true }, // e.g., Dell Laptop
  category: { type: String, enum: ['Laptop', 'Desktop', 'Server', 'Mobile', 'Software', 'Other'], required: true },
  purchaseDate: { type: Date },
  warrantyExpiry: { type: Date },
  status: { type: String, enum: ['Available', 'In Use', 'Under Maintenance', 'Retired'], default: 'Available' },
  assignedTo: { type: String, default: null }, // Employee/User ID or name
  location: { type: String }, // Office or department
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);