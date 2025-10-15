// lib/mongodb.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    // v-- ADD THIS LOG --v
    console.log("DATABASE: Using cached connection to:", cached.conn.name);
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;

  // v-- AND ADD THIS LOG --v
  console.log("DATABASE: Created new connection to:", cached.conn.name);
  return cached.conn;
}

export default dbConnect;
