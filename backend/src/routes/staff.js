const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Client = require('../models/Client');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper: compute shift status
function computeShiftStatus(assignment) {
  const SHIFTS = {
    'Morning (6AM-2PM)': { startTime: '06:00', endTime: '14:00' },
    'Afternoon (2PM-10PM)': { startTime: '14:00', endTime: '22:00' },
    'Night (10PM-6AM)': { startTime: '22:00', endTime: '06:00' },
    'Active Night (10PM-6AM)': { startTime: '22:00', endTime: '06:00' },
    'Sleepover (10PM-6AM)': { startTime: '22:00', endTime: '06:00' }
  };

  let shiftDef = SHIFTS[assignment.shift];

  // Parse custom time range format: "4:13 PM - 10:14 PM"
  if (!shiftDef && assignment.shift) {
    const match = assignment.shift.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );
    if (match) {
      const to24 = (h, m, ampm) => {
        let hour = parseInt(h, 10);
        if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${m}`;
      };
      shiftDef = {
        startTime: to24(match[1], match[2], match[3]),
        endTime: to24(match[4], match[5], match[6])
      };
    }
  }

  if (!shiftDef) {
    // Fallback: compare date only
    const now = new Date();
    const assignmentDate = new Date(assignment.startDate);
    assignmentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (assignmentDate > today) return { computedStatus: 'Pending', statusBadge: 'Upcoming', shiftPhase: 'before' };
    if (assignmentDate < today) return { computedStatus: 'Previous', statusBadge: 'Completed', shiftPhase: 'after' };
    return { computedStatus: 'Current', statusBadge: 'Active Now', shiftPhase: 'during' };
  }

  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignmentDate = new Date(assignment.startDate);
  assignmentDate.setHours(0, 0, 0, 0);

  // For recurring assignments, evaluate today's shift window instead of the original start date
  const shiftDate = assignmentDate <= today ? today : assignmentDate;

  const [startH, startM] = shiftDef.startTime.split(':').map(Number);
  const [endH, endM] = shiftDef.endTime.split(':').map(Number);

  const shiftStart = new Date(shiftDate);
  shiftStart.setHours(startH, startM, 0, 0);

  const shiftEnd = new Date(shiftDate);
  shiftEnd.setHours(endH, endM, 0, 0);
  if (endH < startH) shiftEnd.setDate(shiftEnd.getDate() + 1);

  if (now < shiftStart) {
    const diffMs = shiftStart - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const badge = diffHours > 0 ? `Starts in ${diffHours}h ${diffMins}m` : `Starts in ${diffMins}m`;
    return { computedStatus: 'Pending', statusBadge: badge, shiftPhase: 'before' };
  }
  if (now > shiftEnd) {
    return { computedStatus: 'Previous', statusBadge: 'Completed', shiftPhase: 'after' };
  }
  return { computedStatus: 'Current', statusBadge: 'Active Now', shiftPhase: 'during' };
}

// GET /api/staff/dashboard
router.get('/dashboard', auth, requireRole('staff'), async (req, res) => {
  try {
    const staffId = req.user._id;

    const assignments = await Assignment.find({ staffId, isActive: true }).populate('clientId');
    const clientIds = [...new Set(assignments.map(a => a.clientId?._id?.toString()).filter(Boolean))];

    const totalNotes = await Note.countDocuments({ staffId });
    const pendingNotes = await Note.countDocuments({ staffId, status: { $in: ['Pending', 'Review', 'Draft'] } });
    const verifiedNotes = await Note.countDocuments({ staffId, status: 'Approved' });
    const recentNotes = await Note.find({ staffId })
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Find current active shift
    const now = new Date();
    let shift = null;
    let shiftType = null;

    for (const assignment of assignments) {
      const status = computeShiftStatus(assignment);
      if (status.computedStatus === 'Current') {
        const times = assignment.shift.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi) || [];
        const parts = assignment.shift.split(/\s*-\s*/);
        shift = {
          date: assignment.startDate,
          startTime: times[0] || parts[0]?.trim() || '',
          endTime: times[1] || parts[1]?.trim() || '',
          shift: assignment.shift
        };
        shiftType = 'active';
        break;
      }
    }

    res.json({
      success: true,
      data: {
        staffName: req.user.name,
        totalNotes,
        pendingNotes,
        verifiedNotes,
        clientCount: clientIds.length,
        recentNotes,
        shift,
        shiftType
      }
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// GET /api/staff/:staffId/shifts/overview
router.get('/:staffId/shifts/overview', auth, requireRole('staff'), async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const assignments = await Assignment.find({ staffId, isActive: true })
      .populate('clientId', 'name careLevel room address')
      .sort({ startDate: -1 });

    const enriched = assignments.map(a => {
      const status = computeShiftStatus(a);
      return {
        ...a.toObject(),
        ...status
      };
    });

    res.json({
      success: true,
      data: {
        assignments: enriched,
        totalAssignments: enriched.length
      }
    });
  } catch (error) {
    console.error('Shifts overview error:', error);
    res.status(500).json({ message: 'Failed to load shifts' });
  }
});

// GET /api/staff/clients
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
    console.error('Staff clients error:', error);
    res.status(500).json({ message: 'Failed to load clients' });
  }
});

// GET /api/staff/clients/:clientId/notes
router.get('/clients/:clientId/notes', auth, requireRole('staff'), async (req, res) => {
  try {
    const notes = await Note.find({
      clientId: req.params.clientId,
      staffId: req.user._id
    })
      .populate('clientId', 'name careLevel room')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Client notes error:', error);
    res.status(500).json({ message: 'Failed to load notes' });
  }
});

// POST /api/staff/clients/:clientId/notes
router.post('/clients/:clientId/notes', auth, requireRole('staff'), async (req, res) => {
  try {
    const { content, noteType, category, status } = req.body;

    // Get the current assignment for shift info
    const assignment = await Assignment.findOne({
      staffId: req.user._id,
      clientId: req.params.clientId,
      isActive: true
    });

    const note = await Note.create({
      clientId: req.params.clientId,
      staffId: req.user._id,
      content,
      noteType: noteType || 'text',
      category: category || 'General',
      status: status || 'Review',
      shift: assignment?.shift || 'Unknown',
      shiftDate: assignment?.startDate || new Date()
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// POST /api/staff/clients/:clientId/notes/lock-and-send
router.post('/clients/:clientId/notes/lock-and-send', auth, requireRole('staff'), async (req, res) => {
  try {
    const consolidatedNotes = await Note.find({
      clientId: req.params.clientId,
      staffId: req.user._id,
      status: 'Consolidated',
      isLocked: false
    }).sort({ createdAt: 1 });

    if (consolidatedNotes.length === 0) {
      return res.status(400).json({ message: 'No consolidated notes to send' });
    }

    // Get assignment for shift info
    const assignment = await Assignment.findOne({
      staffId: req.user._id,
      clientId: req.params.clientId,
      isActive: true
    });

    // Build entries array from all consolidated notes
    const entries = consolidatedNotes.map(n => ({
      content: n.content,
      noteType: n.noteType,
      createdAt: n.createdAt,
      attachments: n.attachments || []
    }));

    // Create one merged submitted document
    await Note.create({
      clientId: req.params.clientId,
      staffId: req.user._id,
      content: `Shift notes — ${consolidatedNotes.length} entr${consolidatedNotes.length !== 1 ? 'ies' : 'y'}`,
      noteType: 'consolidated',
      status: 'Submitted',
      isLocked: true,
      lockedAt: new Date(),
      shift: assignment?.shift || null,
      shiftDate: assignment?.startDate || null,
      entries
    });

    // Remove the individual consolidated notes
    await Note.deleteMany({
      _id: { $in: consolidatedNotes.map(n => n._id) }
    });

    res.json({ success: true, message: `${consolidatedNotes.length} notes merged and sent as one document` });
  } catch (error) {
    console.error('Lock and send error:', error);
    res.status(500).json({ message: 'Failed to lock and send notes' });
  }
});

// POST /api/staff/clients/:clientId/notes/confirm-review
router.post('/clients/:clientId/notes/confirm-review', auth, requireRole('staff'), async (req, res) => {
  try {
    const result = await Note.updateMany(
      {
        clientId: req.params.clientId,
        staffId: req.user._id,
        status: { $in: ['Draft', 'Review'] },
        isLocked: false
      },
      { $set: { status: 'Consolidated' } }
    );
    res.json({ success: true, message: `${result.modifiedCount} notes confirmed`, data: result });
  } catch (error) {
    console.error('Confirm review error:', error);
    res.status(500).json({ message: 'Failed to confirm review notes' });
  }
});

// POST /api/staff/clients/:clientId/notes/:noteId/unlock
router.post('/clients/:clientId/notes/:noteId/unlock', auth, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      { isLocked: false, unlockedAt: new Date(), status: 'Review' },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Unlock note error:', error);
    res.status(500).json({ message: 'Failed to unlock note' });
  }
});

// GET /api/staff/clients/:clientId/assignment
router.get('/clients/:clientId/assignment', auth, requireRole('staff'), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      staffId: req.user._id,
      clientId: req.params.clientId,
      isActive: true
    }).populate('clientId', 'name careLevel room');

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found' });
    }

    const status = computeShiftStatus(assignment);

    res.json({
      success: true,
      data: {
        ...assignment.toObject(),
        ...status
      }
    });
  } catch (error) {
    console.error('Assignment fetch error:', error);
    res.status(500).json({ message: 'Failed to load assignment' });
  }
});

// PUT /api/staff/clients/:clientId/odometer
router.put('/clients/:clientId/odometer', auth, requireRole('staff'), async (req, res) => {
  try {
    const { startOdometer, endOdometer } = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { staffId: req.user._id, clientId: req.params.clientId, isActive: true },
      { startOdometer, endOdometer },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Odometer update error:', error);
    res.status(500).json({ message: 'Failed to save odometer' });
  }
});

// POST /api/staff/clients/:clientId/files
router.post('/clients/:clientId/files', auth, requireRole('staff'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const assignment = await Assignment.findOne({
      staffId: req.user._id,
      clientId: req.params.clientId,
      isActive: true
    });

    const attachments = req.files.map(f => ({
      originalName: f.originalname,
      path: `uploads/${f.filename}`,
      mimetype: f.mimetype,
      size: f.size
    }));

    const note = await Note.create({
      clientId: req.params.clientId,
      staffId: req.user._id,
      content: `File upload: ${req.files.length} file(s)`,
      noteType: 'file',
      category: 'General',
      status: 'Review',
      shift: assignment?.shift || 'Unknown',
      shiftDate: assignment?.startDate || new Date(),
      attachments
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// DELETE /api/staff/notes/:noteId
router.delete('/notes/:noteId', auth, requireRole('staff'), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, staffId: req.user._id });

    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.isLocked) return res.status(403).json({ message: 'Cannot delete a locked note' });

    await Note.findByIdAndDelete(req.params.noteId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

// GET /api/staff/appointments
router.get('/appointments', auth, requireRole('staff'), async (req, res) => {
  try {
    const filter = { staffId: req.user._id };
    if (req.query.upcoming === 'true') {
      filter.date = { $gte: new Date() };
    }
    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name')
      .sort({ date: 1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).json({ message: 'Failed to load appointments' });
  }
});

module.exports = router;
