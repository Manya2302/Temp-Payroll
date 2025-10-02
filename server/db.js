
import 'dotenv/config';
import { connectMongoDB } from './mongodb.js';
import { log } from './log.js';

// Initialize MongoDB connection
await connectMongoDB();