const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["assigned", "active", "completed"],
      default: "assigned"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
