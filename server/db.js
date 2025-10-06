

import 'dotenv/config';
import { connectMongoDB } from './mongodb.js';
import { log } from './log.js';

// Optional: allow skipping MongoDB connection for local debugging
// Set SKIP_DB=true in environment to skip connecting to Mongo
const skipDb = (process.env.SKIP_DB || 'false').toLowerCase() === 'true';

if (skipDb) {
	log('Skipping MongoDB connection (SKIP_DB=true)', 'db');
} else {
	// Initialize MongoDB connection
	await connectMongoDB();
}