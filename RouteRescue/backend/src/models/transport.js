import mongoose from "mongoose";

const transportSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ["Train", "Bus", "Flight"],
    required: true
  },
  service: {
    type: String,
    required: true
  },
  departure: {
    type: String,
    required: true
  },
  arrival: {
    type: String,
    required: true
  },
  durationHours: {
    type: Number,
    required: true
  },
  distanceKm: {
    type: Number,
    required: true
  },
  farePerPerson: {
    type: Number,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  days: {
    type: [String],
    default: ["Daily"]
  }
}, {
  versionKey: false,
  collection: "transport"
});

const Transport = mongoose.model("Transport", transportSchema);

export default Transport;