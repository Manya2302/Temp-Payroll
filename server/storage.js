
import { DatabaseStorage as MongoDBStorage } from "./mongodb-storage.js";


export { MongoDBStorage as DatabaseStorage };

export const storage = new MongoDBStorage();