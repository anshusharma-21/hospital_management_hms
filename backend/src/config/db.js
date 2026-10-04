const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_vision_hms';
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.log(`[MongoDB] Local daemon not responding. Initializing embedded high-performance MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: { dbName: 'hospital_vision_hms' }
      });
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB] Embedded MongoMemoryServer connected at: ${uri}`);

      // Run automatic seed data
      const { seedDatabase } = require('../utils/seedData');
      await seedDatabase();
    } catch (memErr) {
      console.error('[MongoDB] Error starting MongoMemoryServer:', memErr.message);
    }
  }
};

module.exports = connectDB;
