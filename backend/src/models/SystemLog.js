import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  service: {
    type: String,
    required: true,
  },
  trace: String,
  request: {
    method: String,
    url: String,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
  },
  response: {
    statusCode: Number,
    body: mongoose.Schema.Types.Mixed,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

const SystemLog = mongoose.model('SystemLog', SystemLogSchema);

export default SystemLog;