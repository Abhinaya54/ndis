const mongoose = require('mongoose');

const shiftHistorySchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  shift: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  completedAt: { type: Date },
  shiftNotes: { type: String },
  isLocked: { type: Boolean, default: true },
  unlockReason: { type: String },
  unlockedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ShiftHistory', shiftHistorySchema);
