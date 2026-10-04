const dns = require('dns');

// Use reliable DNS servers for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;

    if (!connUri) {
      throw new Error('MONGODB_URI is not configured.');
    }

    console.log('[MongoDB] Attempting database connection...');

    // Hide password from logs
    const safeUri = connUri.replace(/:([^:@]+)@/, ':****@');

    console.log('[MongoDB] Using URI:', safeUri);

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB] Connected successfully to host: ${conn.connection.host}`
    );

    console.log(
      `[MongoDB] Database: ${conn.connection.name}`
    );

    console.log(
      '[MongoDB] MongoDB Atlas connection successful.'
    );

  } catch (error) {
    console.error('[MongoDB] Database connection failed.');
    console.error('[MongoDB] Error:', error.message);

    
    process.exit(1);
  }
};

module.exports = connectDB;