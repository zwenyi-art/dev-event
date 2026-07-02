import mongoose from "mongoose";
type MongooseCache={
    conn:typeof mongoose | null;
    promise:Promise<typeof mongoose> | null;
}

declare global{
    var mongoose:MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI

const cached:MongooseCache = global.mongoose || {conn: null, promise: null}

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Return existing connection promise if one is in progress
  if (!cached.promise) {
    // Validate MongoDB URI exists
    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    }
    const options = {
      bufferCommands: false, // Disable Mongoose buffering
    };

    // Create a new connection promise
    cached.promise = mongoose.connect(MONGODB_URI!, options).then((mongoose):typeof mongoose => {
      return mongoose;
    });
  }

  try {
    // Wait for the connection to establish
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on error to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
export default connectDB;