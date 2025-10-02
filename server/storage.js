import { DatabaseStorage as MongoDBStorage } from "./mongodb-storage.js";

// Export the new MongoDB storage as the default storage
export { MongoDBStorage as DatabaseStorage };

export const storage = new MongoDBStorage();

