const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Do not call process.exit(1) on Vercel to prevent FUNCTION_INVOCATION_FAILED.
    // This allows Express routes to return descriptive error responses instead of crashing.
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
