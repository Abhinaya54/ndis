const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  tripDate: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  relatedShift: { type: String },
  purpose: { type: String, required: true },
  startOdometer: { type: Number, required: true },
  endOdometer: { type: Number, required: true },
  totalDistance: { type: Number },
  staffNotes: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejectionReason: { type: String }
}, { timestamps: true });

tripSchema.pre('save', function (next) {
  if (this.startOdometer != null && this.endOdometer != null) {
    this.totalDistance = this.endOdometer - this.startOdometer;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
