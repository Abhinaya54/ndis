const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  room: { type: String, trim: true },
  careLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  ndisNumber: { type: String, trim: true },
  dateOfBirth: { type: Date },
  emergencyContact: { type: String, trim: true },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
