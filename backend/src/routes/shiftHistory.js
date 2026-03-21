const express = require('express');
const { auth } = require('../middleware/auth');
const ShiftHistory = require('../models/ShiftHistory');
const Note = require('../models/Note');

const router = express.Router();

// GET /api/shift-history
router.get('/', auth, async (req, res) => {
  try {
    const { dateRange } = req.query;
    const filter = {};

    // Staff only sees their own shifts; supervisors see all
    if (req.user.role === 'staff') {
      filter.staffId = req.user._id;
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
        case '3months':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filter.startDate = { $gte: startDate };
      }
    }

    const shifts = await ShiftHistory.find(filter)
      .populate('clientId', 'name careLevel room address')
      .populate('staffId', 'name email')
      .sort({ startDate: -1 });

    // Attach client notes to each shift
    const enrichedShifts = await Promise.all(
      shifts.map(async (shift) => {
        const clientNotes = await Note.find({
          clientId: shift.clientId?._id,
          staffId: shift.staffId?._id,
          shiftDate: shift.startDate
        }).sort({ createdAt: -1 });

        return {
          ...shift.toObject(),
          clientNotes
        };
      })
    );

    res.json({ success: true, data: enrichedShifts });
  } catch (error) {
    console.error('Shift history error:', error);
    res.status(500).json({ message: 'Failed to load shift history' });
  }
});

// GET /api/shift-history/export (must be before /:id routes)
router.get('/export', auth, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { period } = req.query;
    const filter = {};

    if (req.user.role === 'staff') {
      filter.staffId = req.user._id;
    }

    const now = new Date();
    switch (period) {
      case 'today':
        filter.startDate = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filter.startDate = { $gte: weekAgo };
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filter.startDate = { $gte: monthAgo };
        break;
      }
      case 'year': {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filter.startDate = { $gte: yearAgo };
        break;
      }
    }

    const shifts = await ShiftHistory.find(filter)
      .populate('clientId', 'name careLevel')
      .populate('staffId', 'name')
      .sort({ startDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Shift History');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Shift', key: 'shift', width: 20 },
      { header: 'Client', key: 'client', width: 25 },
      { header: 'Staff', key: 'staff', width: 25 },
      { header: 'Care Level', key: 'careLevel', width: 12 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    shifts.forEach(s => {
      sheet.addRow({
        date: s.startDate ? new Date(s.startDate).toLocaleDateString() : '',
        shift: s.shift,
        client: s.clientId?.name || '',
        staff: s.staffId?.name || '',
        careLevel: s.clientId?.careLevel || '',
        completedAt: s.completedAt ? new Date(s.completedAt).toLocaleString() : '',
        status: s.isLocked ? 'Locked' : 'Unlocked',
        notes: s.shiftNotes || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=shift_report_${period}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export report' });
  }
});

// PUT /api/shift-history/:id/unlock
router.put('/:id/unlock', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const shift = await ShiftHistory.findByIdAndUpdate(
      req.params.id,
      {
        isLocked: false,
        unlockReason: reason,
        unlockedAt: new Date()
      },
      { new: true }
    ).populate('clientId', 'name careLevel room address')
     .populate('staffId', 'name');

    if (!shift) return res.status(404).json({ message: 'Shift record not found' });
    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('Unlock shift error:', error);
    res.status(500).json({ message: 'Failed to unlock shift' });
  }
});

// DELETE /api/shift-history/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const shift = await ShiftHistory.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift record not found' });

    // Delete associated notes
    await Note.deleteMany({
      clientId: shift.clientId,
      staffId: shift.staffId,
      shiftDate: shift.startDate
    });

    await ShiftHistory.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Shift and associated notes deleted' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ message: 'Failed to delete shift record' });
  }
});

module.exports = router;
