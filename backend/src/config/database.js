const mongoose = require('mongoose');

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries -= 1;
      console.error(`❌ MongoDB connection failed. Retries left: ${retries}`);
      console.error(error.message);
      if (retries === 0) {
        console.error('❌ Could not connect to MongoDB. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
