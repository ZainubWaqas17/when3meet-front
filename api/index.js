const mongoose = require('mongoose');
const app = require('../backend/app');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
