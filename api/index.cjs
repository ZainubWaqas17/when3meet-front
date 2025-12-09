const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

let isConnected = false;
let app;

async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'when3meet'
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

function createApp() {
  if (app) return app;
  
  app = express();
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());

  const availability_routes = require('../backend/routes/availability_routes');
  const event_routes = require('../backend/routes/event_routes');
  const user_routes = require('../backend/routes/user_routes');

  app.use('/api/events', event_routes);
  app.use('/api', availability_routes);
  app.use('/api/users', user_routes);

  app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working' });
  });

  return app;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
    const expressApp = createApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message 
    });
  }
};
