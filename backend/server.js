process.env.TZ = 'Australia/Sydney';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/staff', require('./src/routes/staff'));
app.use('/staff', require('./src/routes/staffTrips'));
app.use('/api/supervisor', require('./src/routes/supervisor'));
app.use('/api/shift-history', require('./src/routes/shiftHistory'));
app.use('/api/notes', require('./src/routes/notes'));
app.use('/api/clients', require('./src/routes/clients'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NexCare API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NexCare server running on port ${PORT}`);
});
