import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  rating: Number,
  message: String,
  journeyId: String,
  createdAt: String
}, {
  versionKey: false,
  collection: "feedback",
  strict: false
});

export default mongoose.model("Feedback", feedbackSchema);