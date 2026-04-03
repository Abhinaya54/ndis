const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  shift: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  startOdometer: { type: Number, default: null },
  endOdometer: { type: Number, default: null },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
