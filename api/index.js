const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const availability_routes = require('../backend/routes/availability_routes');
const event_routes = require('../backend/routes/event_routes');
const user_routes = require('../backend/routes/user_routes');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

let isConnected = false;

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
  }
}

app.use('/api/events', event_routes);
app.use('/api', availability_routes);
app.use('/api/users', user_routes);

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
