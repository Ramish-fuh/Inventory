import Log from '../models/Log.js';
import SystemLog from '../models/SystemLog.js';
import logger from '../utils/logger.js';
import { generatePDFReport, generateExcelReport } from '../utils/reportGenerator.js';

// Create a new log entry
export const createLog = async (req, res) => {
  try {
    const log = await Log.create(req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all log entries
export const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const skip = (page - 1) * pageSize;

    const {
      startDate,
      endDate,
      category,
      action,
      user
    } = req.query;

    logger.info('Fetching activity logs', {
      requesterId: req.user._id,
      query: req.query
    });

    // Build query using lean() for better performance
    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Add other filters
    if (category) query.category = category;
    if (action) query.action = action;
    if (user) query.user = user;

    // Use Promise.all to run count and find in parallel
    const [logs, total] = await Promise.all([
      Log.find(query)
        .populate('user', 'username fullName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Log.countDocuments(query)
    ]);

    logger.info('Activity logs fetched successfully', {
      requesterId: req.user._id,
      count: logs.length,
      total
    });

    res.json({
      logs,
      pagination: {
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Error fetching activity logs', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id
    });
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

// Get a single log by ID
export const getLogById = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a log entry by ID
export const updateLog = async (req, res) => {
  try {
    const log = await Log.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a log entry by ID
export const deleteLog = async (req, res) => {
  try {
    const log = await Log.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const skip = (page - 1) * pageSize;

    const {
      startDate,
      endDate,
      level,
      service
    } = req.query;

    logger.info('Fetching system logs', {
      requesterId: req.user._id,
      query: req.query
    });

    // Build query using lean() for better performance
    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Add other filters
    if (level) query.level = level;
    if (service) query.service = service;

    // Use Promise.all to run count and find in parallel
    const [logs, total] = await Promise.all([
      SystemLog.find(query)
        .populate('user', 'username fullName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      SystemLog.countDocuments(query)
    ]);

    logger.info('System logs fetched successfully', {
      requesterId: req.user._id,
      count: logs.length,
      total
    });

    res.json({
      logs,
      pagination: {
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Error fetching system logs', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id
    });
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    logger.info('Fetching performance metrics', {
      requesterId: req.user._id,
      query: req.query
    });

    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);

    // Get slow requests (>1s)
    const slowRequests = await SystemLog.find({
      'metadata.duration': { $gt: 1000 },
      ...(startDate || endDate ? { timestamp: dateRange } : {})
    }).count();

    // Get error count
    const errorCount = await SystemLog.find({
      level: 'error',
      ...(startDate || endDate ? { timestamp: dateRange } : {})
    }).count();

    // Get average response time
    const avgResponseTime = await SystemLog.aggregate([
      {
        $match: {
          'metadata.duration': { $exists: true },
          ...(startDate || endDate ? { timestamp: dateRange } : {})
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$metadata.duration' }
        }
      }
    ]);

    // Get requests by service
    const requestsByService = await SystemLog.aggregate([
      {
        $match: {
          service: { $exists: true },
          ...(startDate || endDate ? { timestamp: dateRange } : {})
        }
      },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get error distribution
    const errorsByService = await SystemLog.aggregate([
      {
        $match: {
          level: 'error',
          service: { $exists: true },
          ...(startDate || endDate ? { timestamp: dateRange } : {})
        }
      },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      }
    ]);

    const metrics = {
      slowRequests,
      errorCount,
      averageResponseTime: avgResponseTime[0]?.avgDuration || 0,
      requestsByService: requestsByService.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      errorsByService: errorsByService.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    logger.info('Performance metrics fetched successfully', {
      requesterId: req.user._id,
      metrics
    });

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching performance metrics', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id
    });

    res.status(500).json({ message: 'Error fetching metrics' });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      category,
      level,
      format = 'excel'
    } = req.query;

    logger.info('Exporting logs', {
      requesterId: req.user._id,
      query: req.query
    });

    const query = {};

    // Add date range filter using exact timestamps from query
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    let logs;
    if (type === 'activity') {
      if (category) query.category = category;
      logs = await Log.find(query)
        .populate('user', 'username fullName')
        .sort({ timestamp: -1 });
    } else if (type === 'system') {
      if (level) query.level = level;
      logs = await SystemLog.find(query)
        .populate('user', 'username fullName')
        .sort({ timestamp: -1 });
    } else {
      return res.status(400).json({ message: 'Invalid log type specified' });
    }

    // Generate Excel or PDF file
    const buffer = format === 'pdf' 
      ? await generatePDFReport(logs, type)
      : await generateExcelReport(logs, type);

    // Set appropriate headers
    res.setHeader('Content-Type', format === 'pdf' 
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=logs-${type}-${new Date().toISOString().split('T')[0]}.${format}`);
    
    res.send(buffer);

  } catch (error) {
    logger.error('Error exporting logs', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user._id
    });
    res.status(500).json({ message: 'Error exporting logs' });
  }
};