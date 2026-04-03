const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  content: { type: String },
  noteType: { type: String, enum: ['text', 'voice', 'file'], default: 'text' },
  createdAt: { type: Date, default: Date.now },
  attachments: [{
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }]
});

const noteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  noteType: { type: String, enum: ['text', 'voice', 'file', 'consolidated'], default: 'text' },
  category: { type: String, default: 'General' },
  shift: { type: String },
  shiftDate: { type: Date },
  status: {
    type: String,
    enum: ['Draft', 'Review', 'Consolidated', 'Submitted', 'Pending', 'Approved', 'Rejected'],
    default: 'Review'
  },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  unlockedAt: { type: Date },
  unlockReason: { type: String },
  entries: [entrySchema],
  attachments: [{
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  odometerStatus: { type: String, enum: ['normal', 'flagged', null], default: null }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
