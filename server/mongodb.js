
import mongoose from 'mongoose';
import { log } from './log.js';
import { fixUserIdMismatches } from './startup-fix-user-ids.js';

const connectMongoDB = async () => {
  try {
    
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/loco_payroll';
    
  

    await mongoose.connect(mongoUrl, {
  serverSelectionTimeoutMS: 10000,
    });

    log('MongoDB connected successfully', 'db');
  
    // Run user ID mismatch fix on startup
    await fixUserIdMismatches();
    
    const db = mongoose.connection;
    db.on('error', (err) => {
  
    });
    
    db.once('open', () => {
  
    });

  } catch (error) {
  
  throw error;
  }
};

export { connectMongoDB };