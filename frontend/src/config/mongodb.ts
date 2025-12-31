/**
 * MongoDB Atlas Configuration
 * Connect to MongoDB Atlas database
 */

import mongoose from 'mongoose';

// MongoDB Atlas connection string - Replace with your actual connection string
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/mindsta?retryWrites=true&w=majority';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log(' MongoDB Connected Successfully');
    return db;
  } catch (error) {
    console.error(' MongoDB Connection Error:', error);
    throw error;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export default mongoose;
