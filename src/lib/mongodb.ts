import mongoose from 'mongoose';

const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI,
  options: {
    bufferCommands: false,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  },
};

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

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
    throw new Error(
      `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
