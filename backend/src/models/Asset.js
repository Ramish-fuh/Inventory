import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const assetSchema = new mongoose.Schema({
  assetTag: { 
    type: String, 
    required: [true, 'Asset tag is required'], 
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  category: { 
    type: String, 
    enum: {
      values: ['Laptop', 'Desktop', 'Server', 'Mobile', 'Software', 'Other'],
      message: '{VALUE} is not a valid category'
    },
    required: [true, 'Category is required']
  },
  status: { 
    type: String, 
    enum: {
      values: ['Available', 'In Use', 'Under Maintenance', 'Retired'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Available',
    required: [true, 'Status is required']
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: { 
    type: String,
    required: [true, 'Location is required'],
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
        return !v || v <= new Date();
      },
      message: 'Purchase date cannot be in the future'
    }
  },
  warrantyExpiry: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !this.purchaseDate || v >= this.purchaseDate;
      },
      message: 'Warranty expiry must be after purchase date'
    }
  },
  licenseExpiry: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !this.purchaseDate || v >= this.purchaseDate;
      },
      message: 'License expiry must be after purchase date'
    }
  },
  nextMaintenance: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Next maintenance date must be in the future'
    }
  },
  maintenanceInterval: {
    type: Number,
    validate: {
      validator: function(v) {
        return !v || (Number.isInteger(v) && v > 0);
      },
      message: 'Maintenance interval must be a positive whole number'
    }
  },
  lastMaintenance: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Last maintenance date cannot be in the future'
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

// Handle date fields and cleanup
assetSchema.pre('save', function(next) {
  // Convert date strings to actual Date objects
  const dateFields = ['purchaseDate', 'warrantyExpiry', 'licenseExpiry', 'nextMaintenance', 'lastMaintenance'];
  
  dateFields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      const date = new Date(this[field]);
      if (!isNaN(date.getTime())) {
        this[field] = date;
      } else {
        this[field] = null;
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