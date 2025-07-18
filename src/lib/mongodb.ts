import mongoose from 'mongoose';

/**
 * MongoDB connection configuration
 */
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI,
  options: {
    bufferCommands: false,
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,  // 45 seconds
  }
};

/**
 * Global mongoose instance type
 */
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

/**
 * Initialize global mongoose instance if it doesn't exist
 */
if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connect to MongoDB using a cached connection
 * @returns MongoDB connection object
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  // Return existing connection if available
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // Create new connection if one doesn't exist
  if (!global.mongoose.promise) {
    if (!MONGODB_CONFIG.uri) {
      throw new Error(
        'MongoDB connection error: Please define the MONGODB_URI environment variable in .env.local'
      );
    }

    global.mongoose.promise = mongoose
      .connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options)
      .then(mongoose => mongoose.connection);
  }

  try {
    global.mongoose.conn = await global.mongoose.promise;
    return global.mongoose.conn;
  } catch (error) {
    // Let the error propagate to be handled by the API route
    throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
