// availability_model.js
const { Schema, model, Types } = require("mongoose");
const ObjectId = Types.ObjectId;

const Availability = new Schema(
  {
    eventId: { type: ObjectId, ref: "Event", required: true, index: true },
    userId: { type: ObjectId, ref:"User", required: true },
    timeZone: String,
    slots: [[Number]], // Array of arrays: each sub-array contains slot indices for a day
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// one availability per (event, user)
Availability.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = model("Availability", Availability);
