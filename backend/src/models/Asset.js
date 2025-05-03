import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const assetSchema = new mongoose.Schema({
  assetTag: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['Laptop', 'Desktop', 'Server', 'Mobile', 'Software', 'Other'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Available', 'In Use', 'Under Maintenance', 'Retired'], 
    default: 'Available',
    required: true
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: { 
    type: String,
    required: true,
    trim: true
  },
  serialNumber: { 
    type: String,
    trim: true
  },
  purchaseDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid purchase date format'
    }
  },
  warrantyExpiry: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid warranty expiry date format'
    }
  },
  licenseExpiry: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid license expiry date format'
    }
  },
  nextMaintenance: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid next maintenance date format'
    }
  },
  maintenanceInterval: { 
    type: Number,
    min: [0, 'Maintenance interval cannot be negative'],
    validate: {
      validator: function(v) {
        return !v || Number.isInteger(Number(v));
      },
      message: 'Maintenance interval must be a whole number'
    }
  },
  lastMaintenance: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid last maintenance date format'
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Custom validation for assignedTo based on status
assetSchema.pre('validate', function(next) {
  if (this.status === 'In Use' && !this.assignedTo) {
    this.invalidate('assignedTo', 'Asset must be assigned to a user when status is In Use');
  }
  if (this.status !== 'In Use') {
    this.assignedTo = null;
  }
  next();
});

// Middleware to handle date fields
assetSchema.pre('save', function(next) {
  const dateFields = ['purchaseDate', 'warrantyExpiry', 'licenseExpiry', 'nextMaintenance', 'lastMaintenance'];
  
  dateFields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      const date = new Date(this[field]);
      if (!isNaN(date.getTime())) {
        this[field] = date;
      }
    }
  });

  // Convert empty strings to null
  Object.keys(this.toObject()).forEach(field => {
    if (this[field] === '') {
      this[field] = null;
    }
  });

  next();
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;