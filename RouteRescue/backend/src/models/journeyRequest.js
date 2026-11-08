import mongoose from "mongoose";

const journeyRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  createdAt: String,
  input: mongoose.Schema.Types.Mixed,
  resultsCount: Number
}, {
  versionKey: false,
  collection: "journeyrequests",
  strict: false
});

export default mongoose.model("JourneyRequest", journeyRequestSchema);