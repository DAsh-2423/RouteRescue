import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  type: {
    type: String,
    default: "Standard"
  },
  facilities: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ""
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  versionKey: false
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;