import mongoose from "mongoose";

const journeySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  title: String,
  name: String,
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  legs: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  totalDurationHours: Number,
  elapsedDurationHours: Number,
  transfers: Number,
  intermediateCities: {
    type: [String],
    default: []
  },
  transportationCostPerPerson: Number,
  accommodation: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  totalPerPerson: Number,
  totalGroupCost: Number,
  category: String,
  explanation: String,
  simulated: {
    type: Boolean,
    default: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  versionKey: false,
  collection: "journeys",
  strict: false
});

const Journey = mongoose.model("Journey", journeySchema);

export default Journey;