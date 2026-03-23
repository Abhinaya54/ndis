const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL ||
      '';

    const isProduction = process.env.NODE_ENV === 'production';

    if (!mongoUri) {
      if (isProduction) {
        throw new Error('Missing MongoDB URI. Set MONGODB_URI (or MONGO_URI / DATABASE_URL).');
      }
    }

    const finalUri = mongoUri || 'mongodb://localhost:27017/nexcare';

    if (isProduction && /localhost|127\.0\.0\.1|::1/.test(finalUri)) {
      throw new Error('Invalid MongoDB URI for production. Use a hosted MongoDB connection string.');
    }

    const conn = await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
