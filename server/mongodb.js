import mongoose from 'mongoose';
import { log } from './log.js';

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is missing. Add MONGODB_URL to your environment variables.');
    }

    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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