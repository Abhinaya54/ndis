const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Client = require('../models/Client');
const Assignment = require('../models/Assignment');
const Note = require('../models/Note');

const router = express.Router();

// GET /api/clients/:clientId
router.get('/:clientId', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, data: { client } });
  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ message: 'Failed to fetch client' });
  }
});

// GET /api/clients/:clientId/shifts
router.get('/:clientId/shifts', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ clientId: req.params.clientId })
      .populate('staffId', 'name email')
      .sort({ startDate: -1 });
    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('Get client shifts error:', err);
    res.status(500).json({ message: 'Failed to fetch shifts' });
  }
});

// GET /api/clients/:clientId/notes
router.get('/:clientId/notes', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const notes = await Note.find({ clientId: req.params.clientId })
      .populate('staffId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    console.error('Get client notes error:', err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

module.exports = router;
