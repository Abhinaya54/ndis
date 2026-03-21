const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Client = require('../models/Client');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Trip = require('../models/Trip');
const ShiftHistory = require('../models/ShiftHistory');

const router = express.Router();

// GET /api/supervisor/dashboard
router.get('/dashboard', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const totalNotes = await Note.countDocuments();
    const pendingNotes = await Note.countDocuments({ status: { $in: ['Pending', 'Submitted'] } });
    const verifiedNotes = await Note.countDocuments({ status: 'Approved' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalClients = await Client.countDocuments();

    res.json({
      success: true,
      data: { totalNotes, pendingNotes, verifiedNotes, totalStaff, totalClients }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// GET /api/supervisor/dashboard/overview
router.get('/dashboard/overview', auth, requireRole('supervisor'), async (req, res) => {
  try {
    // Active shifts
    const assignments = await Assignment.find({ isActive: true })
      .populate('clientId', 'name')
      .populate('staffId', 'name');

    const activeShifts = assignments.map(a => ({
      clientId: a.clientId,
      staffId: a.staffId,
      shift: a.shift,
      computedStatus: 'Current'
    }));

    // Pending actions
    const pendingNotes = await Note.countDocuments({ status: { $in: ['Pending', 'Submitted'] } });
    const unassignedClients = await Client.countDocuments({ isActive: true }) - await Assignment.distinct('clientId', { isActive: true }).then(ids => ids.length);
    const draftNotes = await Note.countDocuments({ status: { $in: ['Draft', 'Review'] } });

    // Recent activity
    const recentNotes = await Note.find()
      .populate('staffId', 'name')
      .populate('clientId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    const recentActivity = recentNotes.map(note => ({
      type: note.status === 'Approved' ? 'verification' : note.status === 'Rejected' ? 'rejection' : 'submission',
      staffName: note.staffId?.name || 'Unknown',
      clientName: note.clientId?.name || 'Unknown',
      noteType: note.noteType,
      timestamp: note.updatedAt
    }));

    // Staff availability
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const staffOnShift = await Assignment.distinct('staffId', { isActive: true });

    res.json({
      success: true,
      data: {
        activeShifts,
        pendingActions: {
          pendingNotes,
          unassignedClients: Math.max(0, unassignedClients),
          shiftsActive: activeShifts.length,
          draftNotes
        },
        recentActivity,
        staffAvailability: {
          total: totalStaff,
          onShift: staffOnShift.length,
          available: Math.max(0, totalStaff - staffOnShift.length)
        }
      }
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ message: 'Failed to load overview' });
  }
});

// GET /api/supervisor/clients
router.get('/clients', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load clients' });
  }
});

// GET /api/supervisor/staff
router.get('/staff', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ name: 1 });
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load staff' });
  }
});

// GET /api/supervisor/notes
router.get('/notes', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const { status, client, staff, shift, dateRange } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      const statuses = status.split(',').map(s => s.trim());
      filter.status = { $in: statuses };
    }

    if (client && client !== 'all') {
      filter.clientId = client;
    }

    if (staff && staff !== 'all') {
      filter.staffId = staff;
    }

    if (shift && shift !== 'all') {
      filter.shift = shift;
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const notes = await Note.find(filter)
      .populate('clientId', 'name careLevel room')
      .populate('staffId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Supervisor notes error:', error);
    res.status(500).json({ message: 'Failed to load notes' });
  }
});

// GET /api/supervisor/notes/:noteId
router.get('/notes/:noteId', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId)
      .populate('clientId', 'name careLevel room')
      .populate('staffId', 'name email');

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load note' });
  }
});

// PUT /api/supervisor/notes/:noteId/verify
router.put('/notes/:noteId/verify', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const { status, odometerStatus } = req.body;

    const update = {};
    if (status) update.status = status;
    if (odometerStatus) update.odometerStatus = odometerStatus;

    const note = await Note.findByIdAndUpdate(req.params.noteId, update, { new: true })
      .populate('clientId', 'name')
      .populate('staffId', 'name');

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Verify note error:', error);
    res.status(500).json({ message: 'Failed to verify note' });
  }
});

// PUT /api/supervisor/notes/:noteId/unlock
router.put('/notes/:noteId/unlock', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const { reason } = req.body;

    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      {
        isLocked: false,
        unlockedAt: new Date(),
        unlockReason: reason,
        status: 'Review'
      },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unlock note' });
  }
});

// DELETE /api/supervisor/notes/:noteId
router.delete('/notes/:noteId', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

// GET /api/supervisor/assignments
router.get('/assignments', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('clientId', 'name careLevel room')
      .populate('staffId', 'name email')
      .sort({ startDate: -1 });

    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assignments' });
  }
});

// POST /api/supervisor/assignments
router.post('/assignments', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const assignment = await Assignment.create(req.body);
    const populated = await Assignment.findById(assignment._id)
      .populate('clientId', 'name')
      .populate('staffId', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

// PUT /api/supervisor/assignments/:id
router.put('/assignments/:id', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('clientId', 'name')
      .populate('staffId', 'name');

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update assignment' });
  }
});

// DELETE /api/supervisor/assignments/:id
router.delete('/assignments/:id', auth, requireRole('supervisor'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// GET /api/supervisor/trips
router.get('/trips', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const { status, month } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (month) {
      const monthDate = new Date(month);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
      filter.tripDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const trips = await Trip.find(filter)
      .populate('clientId', 'name')
      .populate('staffId', 'name')
      .sort({ tripDate: -1 });

    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load trips' });
  }
});

// PUT /api/supervisor/trips/:tripId/verify
router.put('/trips/:tripId/verify', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.tripId,
      { status: 'Approved' },
      { new: true }
    );

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve trip' });
  }
});

// PUT /api/supervisor/trips/:tripId/reject
router.put('/trips/:tripId/reject', auth, requireRole('supervisor'), async (req, res) => {
  try {
    const { reason } = req.body;

    const trip = await Trip.findByIdAndUpdate(
      req.params.tripId,
      { status: 'Rejected', rejectionReason: reason },
      { new: true }
    );

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject trip' });
  }
});

module.exports = router;
