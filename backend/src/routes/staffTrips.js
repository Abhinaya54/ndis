const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const Assignment = require('../models/Assignment');

const router = express.Router();

// GET /staff/clients - alias for assigned clients
router.get('/clients', auth, requireRole('staff'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ staffId: req.user._id, isActive: true })
      .populate('clientId');

    const clients = assignments
      .filter(a => a.clientId)
      .map(a => a.clientId)
      .filter((client, idx, arr) => arr.findIndex(c => c._id.toString() === client._id.toString()) === idx);

    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load clients' });
  }
});

// GET /staff/trips
router.get('/trips', auth, requireRole('staff'), async (req, res) => {
  try {
    const trips = await Trip.find({ staffId: req.user._id })
      .populate('clientId', 'name')
      .sort({ tripDate: -1 })
      .limit(20);

    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Trips fetch error:', error);
    res.status(500).json({ message: 'Failed to load trips' });
  }
});

// POST /staff/trips
router.post('/trips', auth, requireRole('staff'), async (req, res) => {
  try {
    const { clientId, tripDate, startTime, endTime, relatedShift, purpose, startOdometer, endOdometer, staffNotes } = req.body;

    if (!clientId || !purpose || !startOdometer || !endOdometer) {
      return res.status(400).json({ message: 'Client, purpose, and odometer readings are required' });
    }

    if (Number(endOdometer) <= Number(startOdometer)) {
      return res.status(400).json({ message: 'End odometer must be greater than start odometer' });
    }

    const trip = await Trip.create({
      staffId: req.user._id,
      clientId,
      tripDate: tripDate || new Date(),
      startTime,
      endTime,
      relatedShift,
      purpose,
      startOdometer: Number(startOdometer),
      endOdometer: Number(endOdometer),
      staffNotes,
      status: 'Pending'
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Failed to submit trip' });
  }
});

// GET /staff/trips/stats
router.get('/trips/stats', auth, requireRole('staff'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTrips = await Trip.find({
      staffId: req.user._id,
      tripDate: { $gte: startOfMonth }
    });

    const totalTrips = monthTrips.length;
    const totalKm = monthTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
    const approved = monthTrips.filter(t => t.status === 'Approved').length;

    res.json({
      success: true,
      data: { totalTrips, totalKm, approved }
    });
  } catch (error) {
    console.error('Trip stats error:', error);
    res.status(500).json({ message: 'Failed to load trip stats' });
  }
});

module.exports = router;
