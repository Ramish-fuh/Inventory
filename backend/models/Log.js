const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., "Checked out asset", "Updated profile"
  target: { type: String }, // Optional: ID or name of the item affected
  timestamp: { type: Date, default: Date.now },
  details: { type: String } // Optional: additional context or notes
});

module.exports = mongoose.model('Log', LogSchema);