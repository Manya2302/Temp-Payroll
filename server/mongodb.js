import mongoose from 'mongoose';
import { log } from './log.js';

const connectMongoDB = async () => {
  try {
    // Use default MongoDB URL if MONGODB_URL is not set
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/loco_payroll';
    
    log(`Attempting to connect to MongoDB at: ${mongoUrl.replace(/\/\/.*@/, '//***:***@')}`, 'db');

    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    log('MongoDB connected successfully', 'db');
    
    // Test the connection
    const db = mongoose.connection;
    db.on('error', (err) => {
      console.error('[db] MongoDB connection error:', err);
    });
    
    db.once('open', () => {
      log('MongoDB database connection established', 'db');
    });

  } catch (error) {
    console.error('[db] MongoDB connection failed:', error);
    throw error;
  }
};

export { connectMongoDB };