const { Schema, model, Types } = require("mongoose");
const ObjectId = Types.ObjectId;

const Event = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    creator: { type: ObjectId, ref:"User",required: true},
    window: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    // Frontend event data (for compatibility with existing CreateEvent flow)
    startTime: String, // e.g., "09:00"
    endTime: String,   // e.g., "17:00"
    selectedDays: [Number], // day numbers in month
    month: Number,
    year: Number,
    dateRange: String,
    // time range
    participants: [
      {
        user: { type: ObjectId, ref:"User" },
      },
    ],
    // record users who have filled availability
    determinedTime: Date,
    adminToken: { type: String, required: true }, // Admin token for event creator
    isPublic: { type: Boolean, default: true }, // Allow public access via link
    schemaVersion: { type: Number, default: 1 },
    // in case we change structure of the collection, allows for easy migrations
  },
  { timestamps: true }
);

// Event.path("window").validate(function (val) {
//   return val?.start && val?.end && val.start < val.end;
// }, "Event window.start must be earlier than window.end");

module.exports = model("Event", Event);
